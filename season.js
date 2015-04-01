/**
 * handles season advancing and handing out rewards for placing in season.
 */


var Season = (function() {

    var SeasonTopReward = '&01';
    var SeasonTopRanks = 5;

    var SeasonChange = {
        NextSeason: {
            name: 'April',
            id: '2015-04'
        },
        HatReward: '&00',
        PointsRequired: 1000
    };

    /** key to change with every change - must be met to allow progress */
    var nextSeasonKey = 'FarTooLongToMakeAnySense';

    function changeKey() {
        nextSeasonKey = 'SEASONKEY' + RandomOperations.nextInt(65536) + '-' + RandomOperations.nextInt(65536) + '-' + RandomOperations.nextInt(65536) + '-' + RandomOperations.nextInt(65536);
    }

    changeKey();


    function checkNextSeason(user) {
        if (hasModRights(user)) {
            var text = "Nächste Saison: '" + SeasonChange.NextSeason.name + "', id: '" + SeasonChange.NextSeason.id + "'";
            var hat = "°>" + KnuddelsServer.getFullSystemImagePath(Hats[SeasonChange.HatReward].image) + "<° ";
            text += '°#°Hut-Belohnung für Teilnahme: ' + hat;
            text += ' ab ' + SeasonChange.PointsRequired + ' P';
            if (Settings.Season.id == SeasonChange.NextSeason.id && Settings.LastSeason.id == SeasonChange.NextSeason.id) {
                text += '°##° --> Season Id nicht gültig';
            } else {
                text += '°##° °>Bestätigen!|/seasonCommit ' + nextSeasonKey + '°';
            }
            sendPrivateMessage(user, text);
        }
    }


    function setHatReward(user, param) {
        if (hasModRights(user)) {
            changeKey();

            var hatkey = param.trim();
            if (Hats.hasOwnProperty(hatkey)) {
                SeasonChange.HatReward = hatkey;
                var hat = "°>" + KnuddelsServer.getFullSystemImagePath(Hats[hatkey].image) + "<° ";
                sendPrivateMessage(user, "Hut " + hat + "als Belohnung für Teilnahme eingestellt.");
            } else {
                sendPrivateMessage(user, "Hut nicht gefunden!");
            }
        }
    }

    function advanceSeason(user, param) {
        // is mod user? and has correct key?
        if (hasModRights(user) && param.trim() == nextSeasonKey) {
            var lastSeasonName = Settings.Season.name;
            var params = {
                ascending: false,
                count: 25
            };

            var entries = UserPersistenceNumbers.getSortedEntries(Settings.Season, params);
            for (var index = 0; index < entries.length; ++index) {
                var entry = entries[index];
                var rank = entry.getRank();
                if (rank <= SeasonTopRanks) {
                    Reward.awardHat(entry.getUser(), SeasonTopReward, 'Für die Super-Platzierung in der Saison ' + lastSeasonName + '!');
                } else {
                    break;
                }
            }

            UserPersistenceNumbers.each(Settings.Season, function(user) {
                Reward.awardHat(user, SeasonChange.HatReward, 'Für die Teilnahme an der Saison ' + lastSeasonName + '!');
                return true;
            }, { ascending: false, minimumValue: SeasonChange.PointsRequired } );

            // destroy previous last season data
            UserPersistanceNumbers.deleteAll(Settings.LastSeason.id);

            Settings.LastSeason = Settings.Season;
            Settings.Season = {
                id: SeasonChange.id,
                name: SeasonChange.name
            };
        }
    }

    function setNextName(user, param) {
        if (hasModRights(user)) {
            changeKey();

            SeasonChange.NextSeason.name = param.trim();
            sendPrivateMessage(user, "Saison Name geändert!");
        }
    }

    function setNextId(user, param) {
        if (hasModRights(user)) {
            changeKey();

            SeasonChange.NextSeason.id = param.trim();
            sendPrivateMessage(user, "Saison ID geändert!");
        }
    }

    var that = {
        seasonCheck: checkNextSeason,
        seasonCommit: advanceSeason,
        seasonHat: setHatReward,
        seasonName: setNextName,
        seasonId: setNextId
    };

    return that;
}());