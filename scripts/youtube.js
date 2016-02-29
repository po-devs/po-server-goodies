/*global Bot, module, sys*/
/*jslint sloppy: true, vars: true*/
function YouTube() {
    var youtubeBot = new Bot("Rotom");

    this.afterChatMessage = function (src, message, channel) {
        if ((message.indexOf("youtube.com") > -1 && message.indexOf("watch?v=") > -1) || message.indexOf("youtu.be/") > -1) {
            var videoId;
            // PC LINK
            if (message.indexOf("youtube.com") !== -1) {
                videoId = message.substr(message.indexOf("watch?v=") + 8, 11).trim();
            }
            // MOBILE LINK
            if (message.indexOf("youtu.be/") !== -1) {
                videoId = message.substr(message.indexOf("youtu.be/") + 9, 11).trim();
            }
            try {
                sys.webCall("http://crystal.moe/youtube?id=" + videoId, function (response) {
                    var x = JSON.parse(response).items[0],
                        title = x.snippet.localized.title,
                        length = x.contentDetails.duration
                            .toLowerCase().substr(2).replace("h", "h ").replace("m", "m ").replace("s", "s"),
                        uploader = x.snippet.channelTitle,
                        likes = parseInt(x.statistics.likeCount, 10),
                        dislikes = parseInt(x.statistics.dislikeCount, 10),
                        ratio = Math.round(likes / (likes + dislikes) * 100);
                    youtubeBot.sendAll("Title: {0}, Length: {1}, Uploader: {2}, Likes: {3}%".format(title, length, uploader, ratio), channel);
                });
            } catch (error) {
                youtubeBot.sendMessage(src, "Loading YouTube data failed.", channel);
            }
        }
        return;
    };
    this.init = function () {
        return;  
    };
}
module.exports = new YouTube();
