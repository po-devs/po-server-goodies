/*global Bot, module, sys*/
/*jslint sloppy: true, vars: true*/
function YouTube() {
    var youtubeBot = new Bot("Rotom");
    var ytApi = sys.getFileContent(Config.dataDir + "ytApi.txt");
    
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
                sys.webCall("https://www.googleapis.com/youtube/v3/videos?id=" + videoId + "&key=" + ytApi + "&part=snippet,statistics,status,contentDetails", function (response) {
                    var x = JSON.parse(response).items[0],
                        title = x.snippet.localized.title,
                        length = x.contentDetails.duration
                            .toLowerCase().substr(2).replace("h", "h ").replace("m", "m "),
                        uploader = x.snippet.channelTitle,
                        likes = parseInt(x.statistics.likeCount, 10),
                        dislikes = parseInt(x.statistics.dislikeCount, 10),
                        ratio = Math.round(likes / (likes + dislikes) * 100) || "-";
                    if (SESSION.users(src).smute.active && sys.auth(src) < 1) {
                        youtubeBot.sendMessage(src, "Title: {0}, Length: {1}, Uploader: {2}, Likes: {3}%".format(title, length, uploader, ratio), channel);
                        return;
                    }
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
