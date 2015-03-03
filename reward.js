/**
 * Created by Daniel on 03.03.2015.
 * Handles the reward system.
 * Essentially it controls the point system, can show the score list
 * and remembers who bought which hats.
 */

var Reward = {};

(function() {
    var CREDITS = 'CREDITS';
    var BR = '°##°';

    // convenience function, will show the picture of the user in front of the name
    function showUser(user) {
        var nick = user.getNick();

        return nick;
    }

    function showScoreEntries(entries) {
        var output = '';
        var lastRank = -1;
        for (var index = 0; index < entries.length; ++index) {
            var entry = entries[index];
            var rank = entry.getRank();
            if (rank == lastRank) {
                rank = '   ';
            } else if (rank < 10) {
                lastRank = rank;
                rank = ' ' + rank + '.';
            } else {
                lastRank = rank;
                rank = rank + '.';
            }
            var points = entry.getValue();

            output += BR + rank + ' ' + showUser(entry.getUser()) + '     ' + points;
        }
        return output;
    }

    function awardPoints(user, points) {
        user.getPersistence().addNumber(Settings.Season.id, points);
        user.getPersistence().addNumber(CREDITS, points);
    }

    function showScoresForSeason(user, season) {
        var params = {
            ascending: false,
            count: 10
        };
        var sortedEntries = UserPersistenceNumbers.getSortedEntries(season.id, params);

        var output = 'Punkte in Saison ' + season.name;
        output += showScoreEntries(sortedEntries);

        var playerPos = UserPersistenceNumbers.getPosition(season.id, user, params);

        if (playerPos >= params.count) {
            var entriesNearPlayer = UserPersistenceNumbers.getSortedEntriesAdjacent(season.id, user, params);
            output += showScoreEntries(entriesNearPlayer);
        }

        sendPrivateMessage(user, output);
    }

    function showScores(user) {
        showScoresForSeason(user, Settings.Season);
    }

    function showOldScores(user) {
        showScoresForSeason(user, Settings.LastSeason);
    }

    Reward = {
        showUser: showUser,
        awardPoints: awardPoints,
        showScores: showScores,
        showOldScores: showOldScores
    };
})();