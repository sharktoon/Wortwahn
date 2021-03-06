/**
 * Created by Daniel on 03.03.2015.
 * Handles the reward system.
 * Essentially it controls the point system, can show the score list
 * and remembers who bought which hats.
 */
require('hats.js');

var Reward = {};

(function() {
    var CREDITS = '_CREDITS_';
    var WORN_HAT = '_HAT_WORN_';
    var OWNED_HATS = '_HATS_OWNED_';
    var BR = '°#°';

    // convenience function, will show the picture of the user in front of the name
    function showUser(user) {
        if (!user) {
            return 'UNBEKANNT';
        }
        var icon = "";
        if (user.getPersistence().hasString(WORN_HAT)) {
            var hatId = user.getPersistence().getString(WORN_HAT);
            if (hatId && Hats.hasOwnProperty(hatId)) {
                icon = "°>" + getImagePath(Hats[hatId].image) + "<° ";
            }
        }
        var nick = user.getProfileLink();

        return icon + nick;
    }

    /** shows a big number with . each 1000 */
    function formatBigNumber(number) {
        try {
            var text = '' + Math.floor(number) % 1000;
            number = Math.floor(number / 1000);
            while (number > 0) {
                var missingNumbers = text.length % 4;
                if (missingNumbers == 1) {
                    text = '00' + text;
                } else if (missingNumbers == 2) {
                    text = '0' + text;
                }
                text = number % 1000 + '.' + text;
                number = Math.floor(number / 1000);
            }
            return text;
        } catch(err) {
        }
        return number;
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

            output += BR + rank + ' ' + showUser(entry.getUser()) + '     ' + formatBigNumber(points);
        }
        return output;
    }

    function awardPoints(user, points) {
        user.getPersistence().addNumber(Settings.Season.id, points);
        user.getPersistence().addNumber(CREDITS, points);

        var totalPoints = user.getPersistence().getNumber(Settings.Season.id, points);
        user.solvedQuest('userGotPoints', totalPoints);
    }

    function showScoresForSeason(user, season) {
        var baseLen = 25, extraLen = 10;
        var params = {
            ascending: false,
            count: baseLen
        };
        var playerPos = UserPersistenceNumbers.getPosition(season.id, user, params);

        if (baseLen <= playerPos && playerPos < baseLen + extraLen) {
            params.count = baseLen + extraLen;
        }

        var sortedEntries = UserPersistenceNumbers.getSortedEntries(season.id, params);

        var output = 'Punkte in Saison ' + season.name;
        output += showScoreEntries(sortedEntries);


        if (playerPos >= params.count) {
            output += BR;
            params.count = extraLen;
            var entriesNearPlayer = UserPersistenceNumbers.getSortedEntriesAdjacent(season.id, user.getUserId(), params);
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

    function showHatShop(user, param) {
        if (param) param = param.trim();

        if (param !== undefined && HatCategories.hasOwnProperty(param)) {
            showHatShopCategory(user, param);
        } else if (param !== undefined && Hats.hasOwnProperty(param)) {
            showHatInfo(user, param);
        } else {
            showHatShopOverview(user);
        }
    }

    function showHatShopOverview(user) {
        var message = "Willkommen im Hutladen!" + BR;
        message += "Hier kannst du deine gewonnenen Punkte in Belohnungen eintauschen!";
        message += BR + "Du hast " + formatBigNumber(user.getPersistence().getNumber(CREDITS, 0)) + " P";

        for (var cat in HatCategories) {
            if (HatCategories.hasOwnProperty(cat)) {
                message += BR;
                message += HatCategories[cat].name;
                message += ' _°>>>besuchen|/hatshop ' + cat + '<°_';
            }
        }

        sendPrivateMessage(user, message);
    }

    function showHatShopCategory(user, category) {
        var cat = HatCategories[category];
        var message = "Hutladen - Kategorie " + cat.name;
        message += BR + "Du hast " + formatBigNumber(user.getPersistence().getNumber(CREDITS, 0)) + " P";

        var ownedList = [];
        if (user.getPersistence().hasObject(OWNED_HATS)) {
            ownedList = user.getPersistence().getObject(OWNED_HATS);
        }

        for (var i = 0; i < cat.hats.length; ++i) {
            var hat = Hats[cat.hats[i]];
            if (hat !== undefined) {
                var extra = "";
                if (ownedList.indexOf(hat.id) != -1) {
                    extra = " (gehört dir)";
                } else if (hat.price > 0) {
                    extra = " (" + formatBigNumber(hat.price) + " P)";
                }
                message += BR + "- °>" + getImagePath(hat.image) + "<° °>>>auswählen|/hatshop " + hat.id + "<°";
                message += extra;
            }
        }
        message += BR + "°>zurück|/hatshop<°";
        sendPrivateMessage(user, message);
    }

    function showHatInfo(user, param) {
        var owned = user.getPersistence().hasObject(OWNED_HATS) && user.getPersistence().getObject(OWNED_HATS).indexOf(param) != -1;

        var hat = Hats[param];
        var message = "Hutladen - Symbol °>" + getImagePath(hat.image) + "<°";
        message += BR + hat.description;
        if (owned) {
            message += BR + "°>>>verwenden|/equiphat " + hat.id + "<°";
            message += BR + "Du besitzt diesen Hut bereits.";
            if (hat.price > 0) message += " (Preis: " + formatBigNumber(hat.price) + ")";
        } else if (hat.price > 0) {
            message += BR + "°>>>kaufen|/buyhat " + hat.id + "<°";
            message += BR + "Preis: " + formatBigNumber(hat.price) + " P (Du hast: " + formatBigNumber(user.getPersistence().getNumber(CREDITS, 0)) + ")";
        } else {
            message += BR + "Diesen Hut gibt es nur für besondere Leistungen!";
        }
        message += BR + "°>zurück|/hatshop " + hat.category + "<°";
        sendPrivateMessage(user, message);
    }

    function equipHat(user, param) {
        if (param === undefined) return;

        param = param.trim();
        var hat = Hats[param];
        if (hat === undefined) return;

        if (user.getPersistence().getString(WORN_HAT) == param) {
            return;
        }

        if (user.getPersistence().hasObject(OWNED_HATS) && user.getPersistence().getObject(OWNED_HATS).indexOf(param) != -1) {
            user.getPersistence().setString(WORN_HAT, param);
        }

        var message = "Du trägst nun °>" + getImagePath(hat.image) + "<°.";
        message += BR + "Damit siehst du richtig gut aus!";

        sendPrivateMessage(user, message);

        var pubText = showUser(user) + " hat einen neuen Hut aufgesetzt!";
        sendPublicMessage(pubText);
    }

    function awardHat(user, hatId, specialText) {
        var hat = Hats[hatId];
        if (hat === undefined) return;

        var ownedList = getOwnedHats(user);
        if (ownedList.indexOf(hatId) != -1) {
            return;
        }

        ownedList.push(hatId);
        user.getPersistence().setObject(OWNED_HATS, ownedList);

        var message = "";
        if (specialText) {
            message = specialText + BR;
        }
        message += "Der Hut °>" + getImagePath(hat.image) + "<° gehört nun dir!";
        message += " Du kannst ihn direkt _°>>>verwenden|/equiphat " + hat.id + "<°_";

        if (user.isOnline()) {
            sendPrivateMessage(user, message);
        }
    }

    function getOwnedHats(user) {
        var ownedList = [];
        if (user.getPersistence().hasObject(OWNED_HATS)) {
            ownedList = user.getPersistence().getObject(OWNED_HATS);
        }
        return ownedList;
    }

    function buyHat(user, param) {
        if (param === undefined) return;

        param = param.trim();
        var hat = Hats[param];
        if (hat === undefined || hat.price <= 0) return;

        if (user.getPersistence().hasObject(OWNED_HATS) && user.getPersistence().getObject(OWNED_HATS).indexOf(param) != -1) {
            user.getPersistence().setString(WORN_HAT, param);
        }

        var credits = user.getPersistence().getNumber(CREDITS, 0);
        if (hat.price > credits) {
            sendPrivateMessage(user, "Du kannst dir den Hut °>" + getImagePath(hat.image) + "<° noch nicht leisten! Spiele weiter!");
            return;
        }

        credits = credits - hat.price;
        user.getPersistence().setNumber(CREDITS, credits);
        awardHat(user, hat.id);
    }

    Reward = {
        getOwnedHats: getOwnedHats,

        showShop: showHatShop,
        equipHat: equipHat,
        buyHat: buyHat,

        awardHat: awardHat,

        showUser: showUser,
        awardPoints: awardPoints,
        showScores: showScores,
        showOldScores: showOldScores
    };
})();