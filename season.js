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
            var text = "Nächste Saison: '" + SeasonChange.NextSeason.name + "' - alte Saison: '" + Settings.Season.name + "', '" + Settings.LastSeason.name + "'";
            text += "°#°id: '" + SeasonChange.NextSeason.id + "' - alte Saison: '" + Settings.Season.id + "', '" + Settings.LastSeason.id + "'";
            var hat = "°>" + KnuddelsServer.getFullSystemImagePath(Hats[SeasonChange.HatReward].image) + "<° ";
            text += '°#°Hut-Belohnung für Teilnahme: ' + hat;
            text += ' ab ' + SeasonChange.PointsRequired + ' P';
            if (Settings.Season.id == SeasonChange.NextSeason.id || Settings.LastSeason.id == SeasonChange.NextSeason.id) {
                text += '°##° Season Id nicht gültig';
            } else {
                text += '°##° °>Bestätigen!|/seasonCommit ' + nextSeasonKey + '<°';
            }
            sendPrivateMessage(user, text);
        }
    }


    function setHatReward(user, param) {
        if (hasModRights(user)) {
            changeKey();

            var hatKey = param.trim();
            if (Hats.hasOwnProperty(hatKey)) {
                SeasonChange.HatReward = hatKey;
                var hat = "°>" + KnuddelsServer.getFullSystemImagePath(Hats[hatKey].image) + "<° ";
                sendPrivateMessage(user, "Hut " + hat + "als Belohnung für Teilnahme eingestellt.");
            } else {
                sendPrivateMessage(user, "Hut nicht gefunden!");
            }
        }
    }

    function advanceSeason(user, param) {
        // is mod user? and has correct key?
        if (hasModRights(user) && param.trim() == nextSeasonKey) {
            changeKey();

            sendPrivateMessage(user, 'Saison wird beendet!');

            var lastSeasonName = Settings.Season.name;
            var params = {
                ascending: false,
                count: 25
            };

            var entries = UserPersistenceNumbers.getSortedEntries(Settings.Season.id, params);
            for (var index = 0; index < entries.length; ++index) {
                var entry = entries[index];
                var rank = entry.getRank();
                if (rank <= SeasonTopRanks) {
                    Reward.awardHat(entry.getUser(), SeasonTopReward, 'Für die Super-Platzierung in der Saison ' + lastSeasonName + '!');
                } else {
                    break;
                }
            }

            UserPersistenceNumbers.each(Settings.Season.id, function(user) {
                Reward.awardHat(user, SeasonChange.HatReward, 'Für die Teilnahme an der Saison ' + lastSeasonName + '!');
                return true;
            }, { ascending: false, minimumValue: SeasonChange.PointsRequired } );

            // destroy previous last season data
            UserPersistenceNumbers.deleteAll(Settings.LastSeason.id);

            Settings.LastSeason = Settings.Season;
            Settings.Season = {
                id: SeasonChange.NextSeason.id,
                name: SeasonChange.NextSeason.name
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