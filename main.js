require('helper.js');
require('texthelper.js');
require('tracker.js');
require('reward.js');
require('dictionary.js');
require('season.js');

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
    CrazyRound: {
        Announcement: 5,
        Duration: 5,
        Rewards: [
            { req: 50, points: 10 },
            { req: 100, points: 25 },
            { req: 500, points: 50 },
            { req: 1000, points: 100 },
            { req: 2500, knuddel: 1 },
            { req: 5000, points: 250 },
            { req: 10000, points: 500 },
            { req: 25000, knuddel: 1 },
            { req: 50000, points: 1000 },
            { req: 100000, hat: '&02' }
        ]
    },
    UseKnuddel: false,
    Season: {
        id: '2015-03',
        name: 'März'
    },
    LastSeason: {
        id: '2015-02',
        name: 'Februar'
    },
    TargetDice: [6, 6, 5],
    AllowPMode: true,

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

    var CrazyInstance = {
        // none, countdown, active
        State: 'none',
        Turns: 0,
        // players: userId -> { Points, Words }
        Players: {},
        Total: 0
    };
    var LetterPool = [];
    var VowelPool = [];

    /** list of user ids that were blacklisted from voting */
    var VoteBlacklist = [];

    /** list of active players - userId: { useP: true/false } */
    var ActivePlayers = {
    };

    /** sends to all interested players */
    function sendToInterestedPlayers(message) {
        if (Settings.AllowPMode) {
            Object.keys(ActivePlayers).forEach(function(userId) {
                if (ActivePlayers[userId].useP) {
                    sendPrivateMessage(KnuddelsServer.getUser(userId), message);
                }
            });
        }
    }

    /** minimum of knuddel the bot needs to own before sharing them */
    var MIN_KNUDDEL = 5;

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
                LetterPool = randomShuffle(LetterPool);
            }

            letters.push(LetterPool.pop());
        }

        var pos = 0;

        // C always appears with H or K
        if (letters.indexOf('C') != -1) {
            if (letters.indexOf('K') == -1 && letters.indexOf('H') == -1) {
                pos = randomNextInt(letters.length);
                var replacement = 'H';
                if (randomNextInt(3) == 0) {
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
                VowelPool = randomShuffle(VowelPool);
            }

            pos = randomNextInt(letters.length);
            letters.splice(pos, 0, VowelPool.pop());
        }

        // Q only ever appears with U
        if (letters.indexOf('Q') != -1) {
            if (letters.indexOf('U') == -1) {
                pos = randomNextInt(letters.length);
                letters.splice(pos, 1, 'U');
            }
        }
    }

    /** display the contents of the letters array in a human readable format */
    function lettersToString(letters) {
        var result = ' ';
        for (var i = 0; i < letters.length; ++i) {
            var colorCode = ValueColorCodes[LetterValue[letters[i]]];

            // result = result + '°r' + colorCode + '°_' + letters[i] + '_°r10[120,120,120]°' + LetterValue[letters[i]] + '°r°  ';
            result = result + TextHelper.get('ColoredLetters', { Color: colorCode, Letter: letters[i], Value: LetterValue[letters[i]]}, undefined);
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
            '-': '',
            "'": '',
            'ä': 'AE',
            'ö': 'OE',
            'ü': 'UE',
            'Ä': 'AE',
            'Ö': 'OE',
            'Ü': 'UE',
            'ß': 'SS'
        };
        var result = entryword;
        for (var germanLetter in REPLACEMENTS) {
            if (REPLACEMENTS.hasOwnProperty(germanLetter)) {
                result = result.replace(germanLetter, REPLACEMENTS[germanLetter]);
            }
        }

        return result;
    }

    /** submit a word by a user */
    function submitWord(user, params, command) {
        if (Round.stage != 'submit') {
            sendPrivateMessage(user, TextHelper.get('SubmitWrongPhase', {}, undefined));
            return;
        }
        var userId = user.getUserId();
        if (!Round.players.hasOwnProperty(userId)) {
            startPlayer(userId);
        }

        if (ActivePlayers.hasOwnProperty(userId)) {
            ActivePlayers[userId].useP = command == 'private-message';
        } else {
            ActivePlayers[userId] = {
                useP: command == 'private-message'
            };
        }

        if (!Round.players.hasOwnProperty(userId)) {
            sendPrivateMessage(user, TextHelper.get('SubmitNotInChannel', {}, undefined));
            return;
        }

        var obj = Round.players[userId];

        var originalWord = params.trim();
        var entry = turnToSpellWord(originalWord);
        var hasChanges = entry != originalWord;
        entry = entry.toUpperCase();

        if (entry.length == 0) {
            sendPrivateMessage(user, TextHelper.get('SubmitNoWord', {Letters: lettersToString(Round.letters)}, undefined));
            return;
        }

        var value = getWordValue(Round.letters, entry);
        if (value < 0) {
            sendPrivateMessage(user, TextHelper.get('SubmitWordImpossible', { Entry: entry, Letters: lettersToString(Round.letters)}, undefined));
            return;
        }

        var acceptance = Dictionary.check(entry);

        if (acceptance === 'reject') {
            sendPrivateMessage(user, TextHelper.get('SubmitWordForbidden', { Entry: entry }, undefined));
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
            extra = TextHelper.get('SubmitWordBonusPoints', {}, undefined);
        }

        if (acceptance === 'vote') {
            obj.value = value;
            obj.word = entry;
            obj.original = originalWord;
            obj.hasChanges = hasChanges;

            obj.step = 'vote';
            if (Voting.hasOwnProperty(entry)) {
                Voting[entry].submit.push(userId);
            } else {
                Voting[entry] = { accept: [], reject: [], submit: [userId], original: originalWord, hasChanges: hasChanges };
            }
            sendPrivateMessage(user, TextHelper.get('SubmitWordVote', {Entry: entry, Value: value, Bonus: extra}, undefined));
        } else if (acceptance === 'accept') {
            obj.value = value;
            obj.word = entry;
            obj.original = originalWord;
            obj.hasChanges = hasChanges;

            obj.step = 'okay';
            sendPrivateMessage(user, TextHelper.get('SubmitWordKnown', {Entry: entry, Value: value, Bonus: extra}, undefined));
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
                hasChanges: false,
                value: -1,
                win: false
            };

            Round.players[userId] = obj;
        }
    }

    /** catch-all function for blacklist command */
    function blacklistFunction(modUser, param) {
        if (hasModRights(modUser)) {
            param = param.trim();
            if (param === '') {
                blacklistShow(modUser, param);
            } else if (param[0] == '!') {
                blacklistUndo(modUser, param.substr(1));
            } else {
                blacklistVoter(modUser, param);
            }
        } else {
            sendPrivateMessage(modUser, TextHelper.get('ModRightsMissing', {}, undefined));
        }
    }

    /** puts a user on the vote blacklist */
    function blacklistVoter(modUser, param) {
        if (hasModRights(modUser)) {
            if (!KnuddelsServer.userExists(param)) {
                sendPrivateMessage(modUser, TextHelper.get('BlacklistUserNotFound', {Nick: param}, undefined));
                return;
            }
            Tracker.log(modUser, 'blacklist-add', param);

            var userId = KnuddelsServer.getUserId(param);
            if (VoteBlacklist.indexOf(userId) == -1) {
                VoteBlacklist.push(userId);
            }

            sendPrivateMessage(modUser, TextHelper.get('BlacklistUserAdded', {Nick: param}, undefined));
        } else {
            sendPrivateMessage(modUser, TextHelper.get('ModRightsMissing', {}, undefined));
        }
    }

    /** shows the blacklisted users */
    function blacklistShow(modUser, param) {
        if (hasModRights(modUser)) {
            var nickList = [];
            for (var i = 0; i < VoteBlacklist.length; ++i) {
                nickList.push(KnuddelsServer.getNickCorrectCase(VoteBlacklist[i]));
            }

            sendPrivateInfoMessage(modUser, JSON.stringify(nickList));
        } else {
            sendPrivateMessage(modUser, TextHelper.get('ModRightsMissing', {}, undefined));
        }
    }

    /** remove a user from the blacklist */
    function blacklistUndo(modUser, param) {
        if (hasModRights(modUser)) {
            if (!KnuddelsServer.userExists(param)) {
                sendPrivateMessage(modUser, TextHelper.get('BlacklistUserNotFound', {Nick: param}, undefined));
                return;
            }
            Tracker.log(modUser, 'blacklist-remove', param);
            var userId = KnuddelsServer.getUserId(param);
            var index = VoteBlacklist.indexOf(userId);
            if (index != -1) {
                VoteBlacklist.splice(index, 1);
            }

            sendPrivateMessage(modUser, TextHelper.get('BlacklistUserRemoved', {Nick: param}, undefined));
        } else {
            sendPrivateMessage(modUser, TextHelper.get('ModRightsMissing', {}, undefined));
        }
    }

    /** check if a user has already voted on a word - or not */
    function hasVoted(voteBox, userId) {
        if (VoteBlacklist.indexOf(userId) != -1) {
            return 'blacklist';
        }

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
                sendPrivateMessage(user, TextHelper.get('VoteSelf', { Entry: word }, undefined));
            } else if (voted) {
                sendPrivateMessage(user, TextHelper.get('VoteAlreadyVoted', {Entry: word }, undefined));
            } else {
                Voting[word].accept.push(user.getUserId());
                sendPrivateMessage(user, TextHelper.get('VoteConfirmAccept', { Entry: word }, undefined));
            }
        } else {
            sendPrivateMessage(user, TextHelper.get('VoteUnknown', { Entry: word }, undefined));
        }
    }

    function rejectSpelling(user, params, command) {
        var word = params.trim().toUpperCase();
        if (Voting.hasOwnProperty(word)) {
            var voted = hasVoted(Voting[word], user.getUserId());
            if (voted === 'submit') {
                sendPrivateMessage(user, TextHelper.get('VoteSelf', { Entry: word }, undefined));
            } else if (voted) {
                sendPrivateMessage(user, TextHelper.get('VoteAlreadyVoted', { Entry: word }, undefined));
            } else {
                Voting[word].reject.push(user.getUserId());
                sendPrivateMessage(user, TextHelper.get('VoteConfirmReject', { Entry: word }, undefined));
            }
        } else {
            sendPrivateMessage(user, TextHelper.get('VoteUnknown', { Entry: word }, undefined));
        }
    }

    /** starts submit phase - every player gets letters assigned */
    function beginSubmit() {
        var dice = 0;
        for (var die = 0; die < Settings.TargetDice.length; ++die) {
            dice += 1 + randomNextInt(Settings.TargetDice[die]);
        }

        Round.target = dice;
        Round.stage = 'submit';
        Round.letters = [];
        refillLetters(Round.letters);

        sendPublicMessage(TextHelper.get('StageSubmitIntro', { Letters: lettersToString(Round.letters), Target: Round.target }, undefined));
        sendToInterestedPlayers(TextHelper.get('StageSubmitIntroShort', { Letters: lettersToString(Round.letters), Target: Round.target }, undefined));

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
                var warningMessage = TextHelper.get('StageSubmitAlmostDone', {Seconds: Settings.Timer.submitFinal / 1000}, undefined);
                sendPublicMessage(warningMessage);
                sendToInterestedPlayers(warningMessage);
                setTimeout(endSubmit, Settings.Timer.submitFinal);
            }
        }, Settings.Timer.submit);
    }

    /** starts voting phase - every player gets the vote links */
    function beginVoting() {
        var text = TextHelper.get('StageVoteListBegin', {}, undefined);
        Round.stage = 'vote';

        for (var entry in Voting) {
            if (Voting.hasOwnProperty(entry)) {
                var original = Voting[entry].original;
                var wordText = original;
                if (Voting[entry].hasChanges) {
                    wordText += ' (' + entry + ')';
                }
                // text += '°##° ' + wordText + ' - _°>okay|/accept ' + entry + '<°_ oder _°>falsch|/reject ' + entry + '<°_';
                text += TextHelper.get('StageVoteListEntry', { WordDisplay: wordText, Entry: entry }, undefined);
            }
        }

        text += TextHelper.get('StageVoteListEnd', {}, undefined);

        sendPublicMessage(text);
        sendToInterestedPlayers(text);

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

        var text = TextHelper.get('StageScoringBegin', {}, undefined);

        var allowedFreePass = Settings.LetterCount + Settings.VowelCount - 1 - randomNextInt(4);

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
                    if (rejectedWords.indexOf(entry.word) == -1) {
                        rejectedWords.push(entry.word);
                    }
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

                if (CrazyInstance.State == 'active') {
                    CrazyInstance.Total += value;
                    if (CrazyInstance.Players.hasOwnProperty(userId)) {
                        CrazyInstance.Players[userId].Points += value;
                        CrazyInstance.Players[userId].Words += 1;
                    } else {
                        CrazyInstance.Players[userId] = {
                            Points: value,
                            Words: 1
                        };
                    }
                } else if (ExtraInstance.Active) {
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
            rejectText = TextHelper.get('StageScoringRejectedBegin', {}, undefined);
            for (var i = 0; i < rejectedWords.length; ++i) {
                var word = rejectedWords[i];
                if (Voting.hasOwnProperty(word)) {
                    var entry = Voting[word];
                    var blueprint = 'StageScoringRejected';
                    if (entry.accept.length == 0 && entry.reject.length == 0) {
                        blueprint = 'StageScoringRejectedNoVotes';
                    } else if (entry.result == 'tie-reject') {
                        blueprint = 'StageScoringRejectedTie';
                    } else if (entry.result == 'reject') {
                        blueprint = 'StageScoringRejected';
                    }
                    rejectText += TextHelper.get(blueprint, { Entry: entry.original }, undefined);
                }
            }
        }

        if (ExtraInstance.Active) {
            ++ExtraInstance.Turns;
        } else if (CrazyInstance.State != 'none') {
            ++CrazyInstance.Turns;
        } else if (totalWinners >= Settings.ExtraRound.MinPlayers) {
            ++ExtraInstance.RoundsToStart;
        }
        if (totalWinners > 0) {
            sendPublicMessage(text + rejectText);
            sendToInterestedPlayers(text);
        } else {
            sendPublicMessage(TextHelper.get('StageScoringNoEntries', {}, undefined) + rejectText);
            sendToInterestedPlayers(TextHelper.get('StageScoringNoEntries', {}, undefined));
        }

        setTimeout(function() {
            if(Round.stage == 'score') {
                beginEndOfRound();
            }
        }, Settings.Timer.score);
    }

    /** gets a display for the rewards when at given points */
    function displayCrazyRewards(points) {
        var text = '';
        var availableKnuddel = KnuddelsServer.getDefaultBotUser().getKnuddelAmount().asNumber() - MIN_KNUDDEL;
        for (var i = 0; i < Settings.CrazyRound.Rewards.length; ++i) {
            var reward = Settings.CrazyRound.Rewards[i];
            var separator = '';

            var line = '°#°';
            if (points >= reward.req) {
                line += '(erreicht)'
            } else {
                line += '"' + reward.req + '"';
            }
            line += ' =>';

            if (reward.hasOwnProperty('points')) {
                line += separator + ' ' + reward.points + ' P';
                separator = ';';
            }
            if (Settings.UseKnuddel && reward.hasOwnProperty('knuddel') && availableKnuddel >= reward.knuddel) {
                line += separator + ' ' + reward.knuddel + ' Knuddel wird verlost!';
                availableKnuddel -= reward.knuddel;
                separator = ';';
            }
            if (reward.hasOwnProperty('hat') && Hats.hasOwnProperty(reward.hat)) {
                var hat = "°>" + KnuddelsServer.getFullSystemImagePath(Hats[reward.hat].image) + "<° ";
                line += separator + ' Hut ' + hat + ' für alle!';
                separator = ' ';
            }

            if (separator != '') {
                text += line;
            }
        }

        return text;
    }

    /** do the payout - for all the fun! */
    function awardCrayRoundEnd(points) {
        var Payout = { points: 0, knuddel: 0, hats: [] };
        var availableKnuddel = KnuddelsServer.getDefaultBotUser().getKnuddelAmount().asNumber() - MIN_KNUDDEL;

        var text = '°#°Auszahlungen der _Verrückten Runde_';
        text += '°#°Erreichte Gesammtpunkte: ' + points;

        for (var i = 0; i < Settings.CrazyRound.Rewards.length; ++i) {
            var reward = Settings.CrazyRound.Rewards[i];

            if (points >= reward.req) {
                if (reward.hasOwnProperty('points') && reward.points > Payout.points) {
                    Payout.points = reward.points;
                }
                if (Settings.UseKnuddel && reward.hasOwnProperty('knuddel') && availableKnuddel >= reward.knuddel) {
                    availableKnuddel -= reward.knuddel;
                    Payout.knuddel += reward.knuddel;
                }
                if (reward.hasOwnProperty('hat') && Hats.hasOwnProperty(reward.hat)) {
                    Payout.hats.push(reward.hat);
                    var hat = "°>" + KnuddelsServer.getFullSystemImagePath(Hats[reward.hat].image) + "<° ";
                    text += '°#°Hut ' + hat + ' für alle!';
                }
            }
        }

        text += '°#°+' + Payout.points + ' P für alle!';


        var randomNumber = [];
        for (var kCount = 0; kCount < Payout.knuddel; ++kCount) {
            randomNumber.push({number: RandomOperations.nextInt(points), paid: false });
        }

        for (var userId in CrazyInstance.Players) {
            if (CrazyInstance.Players.hasOwnProperty(userId)) {
                var user = KnuddelsServer.getUser(userId);
                Reward.awardPoints(user, Payout.points);

                for (var i = 0; i < Payout.hats.length; ++i) {
                    Reward.awardHat(user, Payout.hats[i], 'Die Belohnung für die wahnsinnig tolle Verrückte Runde!');
                }

                if (Settings.UseKnuddel) {
                    var payKnuddel = true;
                    for (var kCount = 0; kCount < randomNumber.length; ++kCount) {
                        randomNumber[kCount].number -= CrazyInstance.Players[userId].Points;
                        if (randomNumber[kCount].number < 0 && payKnuddel && randomNumber[kCount].paid == false) {
                            randomNumber[kCount].paid = true;
                            payKnuddel = false;
                            if (KnuddelsServer.getDefaultBotUser().getKnuddelAmount().asNumber() >= MIN_KNUDDEL) {
                                KnuddelsServer.getDefaultBotUser().transferKnuddel(user, 1, {displayReasonText: 'Los-Gewinn aus der Verrückten Runde!'});
                            }
                        }
                    }
                }
            }
        }

        return text;
    }

    /** end of round, if crazy mode is active */
    function crazyEndOfRound() {
        var text = 'Runde vorbei! Nächste Runde startet gleich!';
        if (CrazyInstance.State == 'countdown') {
            var dt = Settings.CrazyRound.Announcement - CrazyInstance.Turns;
            if (dt <= 0) {
                text += '°#°_Verrückte Runde_ startet jetzt! Alle Punkte werden zusammengezählt.';

                text += displayCrazyRewards(0);

                CrazyInstance.State = 'active';
                CrazyInstance.Turns = 0;
                CrazyInstance.Players = {};
                CrazyInstance.Total = 0;
            } else {
                text += '°#°_Verrückte Runde_ startet in _' + dt + '_ ';
                if (dt == 1) text += 'Runde!';
                else text += 'Runden!'
            }
        } else if (CrazyInstance.State == 'active') {
            if (CrazyInstance.Turns >= Settings.CrazyRound.Duration) {
                // do the payout
                text += awardCrayRoundEnd(CrazyInstance.Total);

                CrazyInstance.State = 'none';
            } else {
                text += '°#°_Verrückte Runde_ läuft! Schon _' + CrazyInstance.Total + ' Punkte_ gesammelt! Runde ' + CrazyInstance.Turns + ' von ' + Settings.CrazyRound.Duration;
                text += displayCrazyRewards(CrazyInstance.Total);
            }
        }

        sendPublicMessage(text);
    }

    function startCrazyRound(user) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            if (CrazyInstance.State == 'none') {
                CrazyInstance.State = 'countdown';
                CrazyInstance.Turns = 0;
            }
            sendPrivateMessage(user, 'Verrückte Runde wird gleich gestartet!');
            Tracker.log(user, 'start-crazy', '');
        }
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
            var text = TextHelper.get('ExtraRoundBetweenRoundsBegin', {}, undefined);

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
                text += TextHelper.get('ExtraRoundBoardBegin', { Turn:ExtraInstance.Turns, Duration:Settings.ExtraRound.Duration}, undefined);

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
                    text += TextHelper.get('ExtraRoundBoardEntry', {Rank: rank, User: Reward.showUser(user), Points: player.Points }, undefined);
                }
            } else {
                ExtraInstance.Active = false;
                ExtraInstance.RoundsToStart = 0;

                text += TextHelper.get('ExtraRoundScoresBegin', {}, undefined);
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

                    text += TextHelper.get('ExtraRoundScoresEntry', { Rank: rank, User: Reward.showUser(user), Points: player.Points, Reward: bonusPoints}, undefined);
                    Reward.awardPoints(user, bonusPoints);

                    if (rank <= 3) {
                        hatWinners.push(userId);
                        // Reward.awardHat(user, '&03', 'Für deine Platzierung in der Extra Runde hast du diesen Hut gewonnen!');
                    }
                }
                text += TextHelper.get('ExtraRoundScoresEnd', {}, undefined);
            }

            sendPublicMessage(text);

            for (var i = 0; i < hatWinners.length; ++i) {
                userId = hatWinners[i];
                var user = KnuddelsServer.getUser(userId);
                Reward.awardHat(user, '&03', TextHelper.get('ExtraRoundRewardHat', {}, undefined));
            }
        } else if (CrazyInstance.State != 'none') {
            crazyEndOfRound();
        } else if (ExtraInstance.RoundsToStart >= Settings.ExtraRound.Pause) {
            ExtraInstance.Active = true;
            ExtraInstance.Turns = 0;
            ExtraInstance.Players = {};
            sendPublicMessage(TextHelper.get('ExtraRoundStartingText', {Duration: Settings.ExtraRound.Duration }, undefined));
        } else {
            sendPublicMessage(TextHelper.get('StageBetweenRounds', {}, undefined));
        }

        setTimeout(function() {
            if (Round.stage == 'none') {
                beginSubmit();
            }
        }, Settings.Timer.signup);
    }

    /** advance the round to the next step */
    function advanceStep(user) {
        if (!user.isChannelOwner()) {
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
        rulesText += '°#°/x WORT - reicht WORT ein, falls du die richtigen Buchstaben dafür hast!';
        rulesText += '°#°    Eine private Nachricht an die App geht dafür auch.';
        rulesText += '°#°°>/regeln|/regeln<° - zeigt diese Hilfe an.';
        rulesText += '°#°°>/punkte|/punkte<° - zeigt die Rangliste für die Saison an';
        rulesText += '°#°°>/altepunkte|/altepunkte<° - zeigt die Rangliste für die vergangene Saison an';
        rulesText += '°#°°>/hutladen|/hutladen<° - betrete den Hutladen, dort gibt es Symbole für Punkte';
        rulesText += '°#°Und am Wichtigsten:';
        rulesText += '°#°Viel Spaß!';
        sendPrivateMessage(user, rulesText);
    }

    // display a list of mcm commands
    function showMcmCommands(user) {
        if (hasModRights(user)) {
            var mcmText = 'Hallo Chef!';
            mcmText += '°#°Folgende zusätliche Befehle stehen dir als Moderator zur Verfügung:';
            mcmText += '°#°°>/stimmen|/stimmen<° - zeigt die Abstimmung der jeweils letzten Runde';
            mcmText += '°#°/blacklist NICK - entzieht NICK das Stimmrecht';
            mcmText += '°#°°>/teach|/teach<° - Worte anschauen, und in die Datenbank übernehmen';
            mcmText += '°#°°>/startcrazy|/startcrazy<° - eine Verrückte Runde (Koop) starten';
            mcmText += '°#°Bitte nicht übertreiben! Und bei /teach bitte immer mit duden.de gegenchecken!';

            sendPrivateMessage(user, mcmText);
        }
    }

    var ChangeSettingsLog = [];

    function changeSettings(user, param) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            ChangeSettingsLog.push({nick: user.getNick(), value: param});
            var newSettings = JSON.parse(param);

            for (var piece in newSettings) {
                if (SettingsBlueprint.hasOwnProperty(piece)) {
                    Settings[piece] = newSettings[piece];
                    sendPrivateInfoMessage(user, 'Changed Settings.' + piece + ' to ' + Settings[piece]);
                }
            }

            if (canChangeStorage()) {
                KnuddelsServer.getPersistence().setObject(SETTINGS, Settings);
            }
        }
    }

    function viewSettings(user, param) {
        if (user.isChannelOwner()) {
            param = param.trim();
            if (Settings.hasOwnProperty(param)) {
                sendPrivateInfoMessage(user, 'Current Settings.' + param + ': ' + Settings[param]);
            } else {
                sendPrivateInfoMessage(user, 'Current Settings: ' + Settings);
            }

            if (user.isChannelOwner()) {
                sendPrivateInfoMessage(user, '' + ChangeSettingsLog);
            }
        }
    }

    function startExtraRound(user) {
        if (user.isChannelModerator() || user.isChannelOwner()) {
            sendPrivateMessage(user, 'Wettkampf startet gleich!');
            ExtraInstance.RoundsToStart = Settings.ExtraRound.Pause;
        }
    }

    function revealVoting(modUser) {
        if (modUser.isChannelModerator() || modUser.isChannelOwner()) {
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
                sendPrivateMessage(modUser, text);
            } else {
                sendPrivateMessage(modUser, 'Keine Ergebnisse vorhanden.');
            }
        } else {
            sendPrivateMessage(modUser, 'Das geht so nicht.')
        }
    }

    App.chatCommands = {
        reveallog: Tracker.show,
        settings: changeSettings,
        settingsView: viewSettings,
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

        blacklist: blacklistFunction,

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
        startcrazy: startCrazyRound,

        seasonId: Season.seasonId,
        seasonName: Season.seasonName,
        seasonHat: Season.seasonHat,
        seasonCheck: Season.seasonCheck,
        seasonCommit: Season.seasonCommit,

        teach: Dictionary.teach,
        forget: Dictionary.forget,
        hideword: Dictionary.hide,
        inspect: Dictionary.inspect,
        showallwords: Dictionary.showAllKnownWords,
        showuseraccept: Dictionary.showUserList
    };

    App.onPrivateMessage = function(privateMessage) {
        submitWord(privateMessage.getAuthor(), privateMessage.getText(), 'private-message');
    };

    /** user just joined the channel */
    App.onUserJoined = function(user) {
        if (hasModRights(user)) {
            showMcmCommands(user);
        }

        var blueprint = 'GreetingNormal';
        var replacements = {};
        if (Round.stage == 'submit') {
            blueprint = 'GreetingSubmitStage';
            replacements = { Letters: lettersToString(Round.letters), Target: Round.target };
        }
        var text = TextHelper.get(blueprint, replacements, undefined);

        sendPrivateMessage(user, text);

        var AWARD_M = 'NPM', AWARD_F = 'NPF';
        if (user.getGender() == Gender.Female) {
            Reward.awardHat(user, AWARD_F, TextHelper.get('GreetingHat', {}, undefined));
        } else {
            Reward.awardHat(user, AWARD_M, TextHelper.get('GreetingHat', {}, undefined));
        }

        ActivePlayers[user.getUserId()] = {
            useP: false
        };
    };

    /** user leaves the channel */
    App.onUserLeft = function(user) {
        delete ActivePlayers[user.getUserId()];
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

})();
