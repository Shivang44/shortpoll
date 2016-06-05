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
    // Get question and options from user request
    var question = request.payload.question;
    var options = request.payload["options[]"];

    //// Store into redis poll hash with key "poll:[random 5 char poll id]", with question, options, and secret, which is a hash of [10 char generated password]
    // Generate poll id
    var poll_id = generatePollId();

    redis.set('poll:a', 'a');
    redis.set('poll:b', 'b');

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
        console.log(poll_id);
        // Store into PC's (Poll Creator) browser a cookie with var "poll" with the poll id and the 10 char generated password
        // IMPORTANT: The 10 char generated password should NOT be stored anywhere on the server after storing in the user's cookie (and a hashed version in redis)
        redis.set('poll', 'test');
        reply.redirect('/view');
    });


}

var viewPoll = function() {
    return redis.get('poll').then((result) => { return result });
}

module.exports = {
    create: createPoll,
    view: viewPoll
}
