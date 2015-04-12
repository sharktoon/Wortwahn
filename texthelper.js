/**
 * Created by Daniel on 12.04.2015.
 * handle text stuff - as in provide a way to replace some parts and change it about quickly.
 * Keep all texts in one place.
 */

var TextHelper = (function() {
    var CHECK_FULL = true;

    var texts = {
        ColoredLetters: {
            text: '°r%Color%°_%Letter%_°r10[120,120,120]°%Value%°r°  ',
            values: [ 'Color', 'Letter', 'Value' ]
        },
        // ------------------------------------------------
        // SUBMIT WORD TEXTS
        // ------------------------------------------------
        SubmitWrongPhase: {
            text: 'In dieser Runde können gerade keine Worte eingereicht werden!',
            values: []
        },
        SubmitNotInChannel: {
            text: 'Sorry! Um mitzuspielen musst du im Channel sein!',
            values: []
        },
        SubmitNoWord: {
            text: 'Du musst ein Wort eingeben.°#°Du kannst diese Buchstaben verwenden:°#°%Letters%',
            values: ['Letters']
        },
        SubmitWordImpossible: {
            text: 'Das Wort "%Entry%" ist mit den Buchstaben leider nicht möglich!°#°Du kannst diese Buchstaben verwenden:°#°%Letters%',
            values: ['Entry', 'Letters']
        },
        SubmitWordForbidden: {
            text: 'Die Buchstabenfolge "%Entry%" ergibt leider kein akzeptiertes Wort!',
            values: ['Entry']
        },
        SubmitWordBonusPoints: {
            text: ' Damit wirst du die Bonuspunkte für die Punktzahl bekommen!',
            values: []
        },
        SubmitWordVote: {
            text: 'Dein Wort "%Entry%" hat den Wert %Value% - falls es von den anderen als gültig akzeptiert wird!%Bonus%',
            values: ['Entry', 'Value', 'Bonus']
        },
        SubmitWordKnown: {
            text: 'Dein Wort "%Entry%" hat den Wert %Value%.%Bonus%',
            values: ['Entry', 'Value', 'Bonus']
        },
        // ------------------------------------------------
        // SPELLING VOTES
        // ------------------------------------------------
        VoteSelf: {
            text: 'Du hast das Wort "%Entry%" selbst eingereicht.',
            values: ['Entry']
        },
        VoteAlreadyVoted: {
            text: 'Du hast deine Stimme bereits für das Wort "%Entry%" abgegeben.',
            values: ['Entry']
        },
        VoteUnknown: {
            text: 'Über das Wort "%Entry%" wird gerade nicht abgestimmt.',
            values: ['Entry']
        },
        VoteConfirmAccept: {
            text: 'Du hast deine Stimme für das Wort "%Entry%" abgegeben: Du findest es okay.',
            values: ['Entry']
        },
        VoteConfirmReject: {
            text: 'Du hast deine Stimme für das Wort "%Entry%" abgegeben: Du findest es NICHT okay.',
            values: ['Entry']
        },
        // ------------------------------------------------
        // STAGES PUBLIC MESSAGES
        // ------------------------------------------------
        StageSubmitIntro: {
            text: 'Die Buchstaben dieser Runde:°#°%Letters%°#°Worte können mit ""/x WORT"" eingereicht werden. Z. B. Echt mit /x echt°#°Bonuspunkte wenn du es schaffst genau _%Target% Punkte_ zu erreichen!',
            values: [ 'Letters', 'Target']
        },
        StageSubmitAlmostDone: {
            text: 'Nur noch %Seconds% Sekunden! Mit /x WORT kann ein Wort eingereicht werden!',
            values: ['Seconds']
        },
        StageVoteListBegin: {
            text: 'Folgende Worte wurden eingereicht:',
            values: []
        },
        StageVoteListEnd: {
            text: '°##°Deine Meinung ist gefragt! Welches Wort ist richtig? Welches ist frei erfunden?',
            values: []
        },
        StageVoteListEntry: {
            text: '°##° %WordDisplay% - _°>okay|/accept %Entry%<°_ oder _°>falsch|/reject %Entry%<°_',
            values: ['WordDisplay', 'Entry', 'Entry']
        },
        // ------------------------------------------------
        // SCORING STAGE
        // ------------------------------------------------
        StageScoringBegin: {
            text: 'Die Beiträge dieser Runde:',
            values: []
        },
        StageScoringNoEntries: {
            text: "Keine Beiträge diese Runde!",
            values: []
        },
        StageScoringRejectedBegin: {
            text: '°##°"Abgelehnte Worte"',
            values: []
        },
        StageScoringRejectedNoVotes: {
            text: '°#° %Entry% : unentscheiden - Münzwurf verloren',
            values: ['Entry']
        },
        StageScoringRejectedTie: {
            text: '°#° %Entry% : unentschieden - Münzwurf verloren',
            values: ['Entry']
        },
        StageScoringRejected: {
            text: '°#° %Entry% : abgelehnt',
            values: ['Entry']
        },
        // ------------------------------------------------
        // SIMPLE TEXT HELPERS
        // ------------------------------------------------
        LineBreak: {
            text: '°##°',
            values: []
        }
    };

    var library = {
        default: texts
    };

    /**
     * Access a text from a library
     * @param index (required) index name of the text
     * @param replacements (semi-optional) object list of replacement holders and its values, required if text requires it
     * @param language (optional) other libraries to be checked for text before default library
     * @returns {*} text from database with all replacements, or ''
     */
    function getText(index, replacements, language) {
        var myEntry;
        if (language && library.hasOwnProperty(language) && library[language].hasOwnProperty(index)) {
            myEntry = library[language][index];
        } else if (library.default.hasOwnProperty(index)) {
            myEntry = library.default[index];
        } else {
            // no entry found, this should actually trigger an exception
            return '';
        }

        var result = myEntry.text;
        if (replacements && myEntry.values) {
            for (var i = 0; i < myEntry.values.length; ++i) {
                var checking = myEntry.values[i];
                if (replacements.hasOwnProperty(checking)) {
                    result = result.replace('%' + checking + '%', replacements[checking]);
                } else if (CHECK_FULL) {
                    // another fail condition!
                    return '';
                } else {
                    // result = result.replace('%' + checking + '%', '');
                }
            }
        } else {
            if (CHECK_FULL && myEntry.values && myEntry.values.length > 0) {
                // no replacements specified, but there should be some? Fail!
                return '';
            }
        }

        return result;
    }

    var that = {
        get: getText,
        getText: getText
    };

    return that;
})();
