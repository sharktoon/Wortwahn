/**
 * Created by Daniel on 03.03.2015.
 * contains some convenience functions to reduce the amount of warnings.
 * Aka: helps hide the not-known functions from the IDE
 */

/** convenience function - so I only see warning once */
function sendPublicMessage(text) {
    KnuddelsServer.getDefaultBotUser().sendPublicMessage(Settings.DefaultBotColor + text);
}

/** convenience - reduces number of warnings in the file */
function sendPrivateMessage(user, message) {
    user.sendPrivateMessage(Settings.DefaultBotColor + message);
}

/** convenience - reduces number of warnings in the file */
function sendPrivateInfoMessage(user, message) {
    var text = message.replace(/"/gi, '');
    user.sendPrivateMessage(text);
}

/** check if a user has moderator rights, or is channel owner */
function hasModRights(user) {
    return user.isChannelModerator() || user.isChannelOwner();
}

/** checks if the channel is the root channel, or not */
function canChangeStorage() {
    var channelName = KnuddelsServer.getChannel().getChannelName();

    var numbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];
    for (var i = 0; i < numbers.length; ++i) {
        if (channelName.indexOf(numbers[i]) != -1) {
            return false;
        }
    }

    return true;
}

/** get a random int in range [0;number[ */
function randomNextInt(number) {
    return RandomOperations.nextInt(number);
}

/** shuffle an array */
function randomShuffle(obj) {
    return RandomOperations.shuffleObjects(obj);
}