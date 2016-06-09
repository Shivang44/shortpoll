var Redis = require('ioredis');
var redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
var Bcrypt = require('bcryptjs');

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

    // Workaround for now. For some reason the POST'd array name is either options or options[], depending on the client who sends it
    var options = typeof request.payload.options === "undefined" ? request.payload["options[]"] : request.payload.options;

    //// Store into redis poll hash with key "poll:[random 5 char poll id]", with question, options, and secret, which is a hash of [10 char generated password]
    // Generate poll id
    var poll_id = generatePollId();


    // Guaranteed unique poll_id now
    var password = Math.random().toString(36).slice(2); // Coupled with the random poll_id, this is secure enough for our purposes

    // Generate salt and hash password
    Bcrypt.genSalt(10, function(err, salt) {
        Bcrypt.hash(password, salt, function(err, hash) {
            var poll_obj = {
                question: question,
                options: options,
                password: hash
            };
            redis.setnx(poll_id, JSON.stringify(poll_obj)).then(function(result) {
                if (result === 0 ) {
                    // There was a collision with the generated poll_id and a poll_id in the database
                    reply('Poll already exists.'); // TODO: Maybe it's possible to redirect user to /create with the same payload to simulate another request?
                } else if (result === 1){
                    // Store into PC's (Poll Creator) browser a cookie with var "poll" with the poll id and the 10 char generated password
                    var cookie_obj = {
                        poll_id: poll_id,
                        password: password
                    };
                    reply(JSON.stringify(cookie_obj));
                }
            });
        });
    });
}

// View poll results, only poll creater can see this page
var viewResults = function(request, reply) {
    // Validate user's cookie
    var error_msg = "An error occurred.";

    // Check that data, and the poll_id and password are at least set
    if (typeof request.state.data === "undefined" || typeof request.state.data["poll_id"] === "undefined" || typeof request.state.data["password"] === "undefined") {
         reply(error_msg);
    } else {
        // Everything is set, compare the password with the salted hash in the DB using bcrypt
        var poll_cookie = request.state.data;
        var poll_obj = redis.get(poll_cookie.poll_id).then(function(result) {
            if (result === null) {
                reply(error_msg);
            } else {
                var poll_obj = JSON.parse(result);
                Bcrypt.compare(poll_cookie.password, poll_obj.password, function(err, result) {
                    if (err || !result) {
                        reply(error_msg);
                    } else {
                        reply.view('view', {
                            title: 'View Poll results'
                        });
                    }
                });

            }
        });
    }

}

module.exports = {
    create: createPoll,
    view: viewResults
}
