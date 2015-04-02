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

/** check if a user has moderator rights, or is channel owner */
function hasModRights(user) {
    return user.isChannelModerator() || user.isChannelOwner();
}
