module.exports = new function() {
    var replyChannel = 0;
    var sendChanMessage = function(src, message) {
        sys.sendMessage(src, message, replyChannel);
    }

    var canVote = function(src) {
        if (!sys.dbRegistered(sys.name(src))) {
            return false;
        }
        if (sys.ratedBattles(sys.name(src), poll.tier) < 75) {
            return false;
        }
        if (sys.ladderRating(src, poll.tier) <= 1000) {
            return false;
        }
        return true;
    }
    var getVote = function(src) {
         var name = sys.name(src).toLowerCase();
         for (var i in poll.voters) {
             if (name == poll.voters[i].name) {
                 return poll.voters[i];
             }
         }
    }
    poll = {
        'running': false,
        'subject': 'Chandelure',
        'answers': ['ban', 'no ban'],
        'tier': 'DW OU',
        'voters': [],
    };
    poll.canVote = canVote;
    poll.getVote = getVote;
    var savePoll = function() {
        delete poll.canVote;
        delete poll.getVote;
        var s = JSON.stringify(poll);
        sys.writeToFile('suspectvoting.json',s);
        poll.canVote = canVote;
        poll.getVote = getVote;
    }
    var loadPoll = function(name) {
        try {
            poll = JSON.parse(sys.getFileContent(name));
            poll.canVote = canVote;
            poll.getVote = getVote;
        } catch (err) {}
    }
    loadPoll('suspectvoting.json');

    var userCommands = {
        'votinghelp': function(src, commandData) {
            sendChanMessage(src, "*** Suspect Voting commands ***");
            sendChanMessage(src, "/vote [subject] [answer]: to vote in a suspect voting");
            sendChanMessage(src, "/removeVote [subject]: to remove your vote in a suspect voting");
            if (sys.auth(src) < 3 && Config.superAdmins.index) return;
            sendChanMessage(src, "*** Owner commands ***");
            sendChanMessage(src, "/whiteList [person]: to approve one's vote in suspect voting");
            sendChanMessage(src, "/startVoting: to start a suspect voting");
            sendChanMessage(src, "/stopVoting: to stop running suspect voting");
            sendChanMessage(src, "/getResults [subject]: to get results of a suspect voting");
            sendChanMessage(src, "/newPoll [subject:tier:answer1:answer2:...]: to make a new voting");
        },
        'vote': function(src, commandData) {
             if (!poll.running) {
                 normalbot.sendChanMessage(src, "There's no poll running.");
                 return;
             }
             if (commandData.substr(0, poll.subject.length).toLowerCase() != poll.subject.toLowerCase()) {
                 normalbot.sendChanMessage(src, "The subject of this poll is: " + poll.subject + ". Please do /vote " + poll.subject + " [your answer]");
                 return;
             }
             var answer = commandData.substr(poll.subject.length+1);
             if (poll.canVote(src)) {
                 if (answer == '') {
                     var vote = poll.getVote(src);
                     if (vote !== undefined) {
                         var d = new Date();
                         d.setTime(vote.time*1000);
                         normalbot.sendChanMessage(src, "You have previously voted '" + vote.answer + "' from IP " + vote.ip + " with rating " + vote.rating + " on " + d.toUTCString());
                         return;
                     }
                     normalbot.sendChanMessage(src, "You haven't voted yet. Valid votes in this poll are: " + poll.answers.join(", "));
                     return;
                 }
                 if (poll.answers.indexOf(answer) == -1) {
                     normalbot.sendChanMessage(src, "Only valid votes in this poll are: " + poll.answers.join(", "));
                     return;
                 }
                 var ip = sys.ip(src);
                 var name = sys.name(src).toLowerCase();
                 for (var i in poll.voters) {
                     if (ip == poll.voters[i].ip) {
                         if (name != poll.voters[i].name) {
                             normalbot.sendChanMessage(src, "Sorry, your IP address has already voted as " + poll.voters[i].name+". The vote will not change.");
                             return;
                         }
                         poll.voters[i].rating = sys.ladderRating(src, poll.tier);
                         poll.voters[i].answer = answer;
                         poll.voters[i].time = parseInt(sys.time());
                         savePoll();
                         normalbot.sendChanMessage(src, "Your vote has been updated.");
                         return;
                     } else if (name == poll.voters[i].name) {
                         poll.voters[i].ip = sys.ip(src);
                         poll.voters[i].rating = sys.ladderRating(src, poll.tier);
                         poll.voters[i].answer = answer;
                         poll.voters[i].time = parseInt(sys.time());
                         savePoll();
                         normalbot.sendChanMessage(src, "Your vote has been updated.");
                         return;
                     }
                 }
                 var o = {
                     'ip': ip,
                     'name': name,
                     'rating': sys.ladderRating(src, poll.tier),
                     'answer': answer,
                     'time': parseInt(sys.time()),
                     'whitelisted': false
                 };
                 poll.voters.push(o);
                 savePoll();
                 normalbot.sendChanMessage(src, "Your vote has been registered. Don't forget to post on the associated topic on the forum saying you voted. If you aren't going to post, do /removeVote " + poll.subject + " now!");
                 return;
             } else {
                 normalbot.sendChanMessage(src, "Sorry, you can't take part in this poll. Your name needs to be registered, you must have over 1000 points and enough battles (you have " + sys.ratedBattles(sys.name(src), poll.tier) + "/75 battles.");
             }
        } ,
        'removevote': function(src, commandData) {
            if (commandData.substr(0, poll.subject.length).toLowerCase() != poll.subject.toLowerCase()) {
                normalbot.sendChanMessage(src, "The subject of this poll is: " + poll.subject + ". Do /removeVote " + poll.subject + " to remove your vote.");
                return;
            }
            var name = sys.name(src).toLowerCase();
            for (var i in poll.voters) {
                    if (name == poll.voters[i].name) {
                        poll.voters.splice(i,1);
                        savePoll();
                        normalbot.sendChanMessage(src, "Your vote has been removed.");
                        return;
                    }
            }
            normalbot.sendChanMessage(src, "You haven't voted with that name.");
        }
    };

    var ownerCommands = {
        'whitelist': function(src, commandData) {
        var target = commandData.toLowerCase();
            for (var i = 0; i < poll.voters.length; ++i) {
                var voter = poll.voters[i];
                if (voter.name == target) {
                    if (voter.whitelisted) {
                        voter.whitelisted = false;
                        normalbot.sendChanMessage(src, '' + voter.name + "'s vote was disapproved.");
                    } else {
                        voter.whitelisted = true;
                        normalbot.sendChanMessage(src, '' + voter.name + "'s vote was approved.");
                    }
                    return;
                }
            }
            normalbot.sendChanMessage(src, '' + commandData + ' has not voted.');
            savePoll();
        },
        'startvoting': function(src, commandData) {
            normalbot.sendChanMessage(src, 'The Poll is running again.');
            sys.sendAll('');
            normalbot.sendAll('The Suspect Voting of ' + cap(poll.subject) +' (' + poll.tier + ') is now running!');
            sys.sendAll('');
            poll.running = true;
            savePoll();
        },
        'stopvoting': function(src, commandData) {
            normalbot.sendChanMessage(src, 'The Votes are frozen now.');
            sys.sendAll('');
            normalbot.sendAll('The Suspect Voting of ' + cap(poll.subject) +' (' + poll.tier + ') has ended!');
            sys.sendAll('');
            poll.running = false;
            savePoll();
        },
        'loadpoll': function(src, commandData) {
            normalbot.sendChanMessage(src, 'Loading ' + commandData);
            loadPoll(commandData);
        },
        'tier': function(src, commandData) {
            normalbot.sendChanMessage(src, "Current tier is '" + poll.tier + "' with " + sys.totalPlayersByTier(poll.tier) + " players.");
            var p = sys.totalPlayersByTier(commandData);
            if (p > 0) {
                poll.tier = commandData;
                normalbot.sendChanMessage(src, "New tier is '" + poll.tier + "' with " + p + " players.");
            }
        },
        'getresults': function(src, commandData) {
            var results = {};
            var unscaled = {};
            for (var i = 0; i < poll.answers.length; ++i) {
                results[poll.answers[i]] = 0;
                unscaled[poll.answers[i]] = 0;
            }
            var countAll = commandData.indexOf("--all") > -1;
            var useOld = commandData.indexOf("--old") > -1;
            var useNew = commandData.indexOf("--new") > -1;
            var verbose = commandData.indexOf("--summarize") == -1;
            var total_users = poll.voters.length;
            var vote_count = 0;
            var p = sys.totalPlayersByTier(poll.tier);
            var divider1 = Math.log(p/2);
            var divider2 = Math.exp(1/divider1);
            if (verbose)
                normalbot.sendChanMessage(src, "Following people voted:")
            for (var i = 0; i < total_users; ++i) {
                var voter = poll.voters[i];
                if (verbose)
                    normalbot.sendChanMessage(src, "" + voter.name+" ("+(voter.ip ? voter.ip : "unknown ip")+") voted for "+voter.answer+" with rating " + voter.rating + ". Approved: " + voter.whitelisted);
                if (voter.whitelisted === false && !countAll) continue;
                var x = voter.rating;
//                if (x>1700) x = 1700;
                var votes;
                if (useOld) {
                    votes = (Math.exp( Math.pow(x/1000,4) / divider1 ) / divider2 - 1) * 10;
                } else if (useNew) {
                    votes = 161.404254079125 - 0.5559179487175973*x + 0.0007211727855474324*x*x - 4.1836247086231597*Math.pow(10,-7)*x*x*x + 9.175407925405417*Math.pow(10,-11)*x*x*x*x;
                } else {
                    votes = 2.2071678321675907*Math.pow(10,-11)*Math.pow(x,4) - 8.358100233098689*Math.pow(10,-8)*Math.pow(x,3)+0.0001190843531468168*Math.pow(x,2) - 0.07185052447548725*x + 14.260635198121216;
                }
                if (votes < 0) votes = 0;
                results[voter.answer] += votes;
                unscaled[voter.answer] += 1;
                ++vote_count;
            }
            var sum = 0;
            for (var i = 0; i < poll.answers.length; ++i) {
                sum += results[poll.answers[i]];
            }
            if (sum > 0) {
                normalbot.sendChanMessage(src, 'The Results of Suspect Voting of ' + cap(poll.subject) + ' is:');
                for (var i = 0; i < poll.answers.length; ++i) {
                    var v = results[poll.answers[i]];
                    var u = unscaled[poll.answers[i]];
                    sendChanMessage(src, 'Option "' + poll.answers[i] + '" had ' + v + ' votes. (' + 100*v/sum + '%, '+u+' persons)');
                }
                sendChanMessage(src, 'Total of ' + total_users + ' took part and ' + vote_count + ' were approved. Total sum of the votes is ' + sum + '.');
            } else {
                if (total_users == 0) {
                    normalbot.sendChanMessage(src, 'No one has voted yet.');
                } else {
                    normalbot.sendChanMessage(src, 'No one has been approved. Use /whitelist [username] to approve votes.');
                }
            }
        },
        'clearpoll': function(src, commandData) {
            normalbot.sendChanMessage(src, 'Sorry, not implemented! Just use /eval poll.voters=[]')
        },
        'newpoll': function(src, commandData) {
            var params = commandData.split(":");
            if (params.length < 4) {
                normalbot.sendChanMessage(src, 'Usage: /newPoll subject:tier:answer1:answer2:...');
                return;
            }
            var s = JSON.stringify(poll);
            var fn = 'oldSuspectVoting'+sys.time()+'.json';
            sys.writeToFile(fn,s);
            normalbot.sendChanMessage(src, 'Old poll saved to '+fn);

            var newSubject = params[0];
            var newTier = params[1];
            var newAnswers = params.splice(2);
            poll.subject = newSubject;
            poll.tier = newTier;
            poll.answers = newAnswers;
            poll.voters = [];
            poll.running = false;
            savePoll();
            normalbot.sendChanMessage(src, 'The poll successfully updated!');
        }
    };

    this.afterLogIn = function(src) {
        if (poll.running) {
            if (poll.canVote(src) && poll.getVote(src) === undefined) {
                normalbot.sendChanMessage(src, 'A Suspect Voting is going on! Use /vote ' + poll.subject + ' [answer] to vote!');
            }
        }
    }

    this.onHelp = function(src, topic, channel) {
        if (topic == "suspectvoting") {
            this.handleCommand(src, "votinghelp", channel);
            return true;
        }
    }

    this.handleCommand = function(src, message, channel) {
        replyChannel = channel;
        var command;
        var commandData = '';
        var pos = message.indexOf(' ');

        if (pos != -1) {
            command = message.substring(0, pos).toLowerCase();
            commandData = message.substr(pos+1);
        } else {
            command = message.substr(0).toLowerCase();
        }
        if (command in userCommands) {
            userCommands[command](src, commandData);
            return true;
        }
        if (command in ownerCommands && (sys.auth(src) >= 3 || isSuperAdmin(src))) {
            ownerCommands[command](src, commandData);
            return true;
        }
    };

    this["help-string"] = "suspectVoting: To know the commands of suspect voting";

}();
