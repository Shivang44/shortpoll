var Redis = require('ioredis');
var redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
var promiseWhile = require('./promiseWhile');

var generatePollId = function() {
    var poll_id = "poll:";
    var possible = "abcdefghijkmnpqrstuvwxyz23456789"; // Similar charachters like o 0 or 1 and l have been removed
    for (var i = 0; i < 5; i++) {
        poll_id += possible.charAt(Math.floor(Math.random() * possible.length));
    }
    return poll_id;
}

var createPoll = function(request, reply) {
    redis.flushall();
    // Get question and options from user request
    var question = request.payload.question;

    // Workaround for now. For some reason the POST'd array name is either options or options[], depending on the client who sends it
    var options = typeof request.payload.options === "undefined" ? request.payload["options[]"] : request.payload.options;

    //// Store into redis poll hash with key "poll:[random 5 char poll id]", with question, options, and secret, which is a hash of [10 char generated password]
    // Generate poll id
    var poll_id = generatePollId();

    // The purpose of the promiseWhile is to find a non-collisiding poll_id
    foundUnique = false;
    promiseWhile(function() {
        return !foundUnique;
    }, function () {
        return redis.exists(poll_id).then(function(result) {
            if (result === 0) {
                foundUnique = true;
            } else if (result === 1) {
                poll_id = generatePollId();
            }
        });
    }).then(function() {
        // Guaranteed unique poll_id now
        var poll_obj = {
            question: question,
            options: options,
            password: ''
        };
        redis.setnx(poll_id, JSON.stringify(poll_obj)).then(function(result) {
            if (result === 0) {
                // Even after checking for collisions, key could not be set.
                // TODO: Implement logging.
                console.log("collision!");
            } else if (result === 1) {
                // Store into PC's (Poll Creator) browser a cookie with var "poll" with the poll id and the 10 char generated password
                var cookie_obj = {
                    poll_id: poll_id,
                    password: ''
                };
                reply.state('data', JSON.stringify(cookie_obj));
                reply.redirect('/view');
            }
        });
    });
}

var viewPoll = function() {
    return redis.get('poll').then((result) => { return result });
}

module.exports = {
    create: createPoll,
    view: viewPoll
}
