const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const Bcrypt = require('bcryptjs');
const Boom = require('boom');

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
    var access_id = Math.random().toString(36).slice(2); // Coupled with the random poll_id, this is secure enough for our purposes

    // Generate salt and hash password
    Bcrypt.genSalt(10, function(err, salt) {
        Bcrypt.hash(access_id, salt, function(err, hash) {
            var poll_obj = {
                question: question,
                options: options,
                access_id: hash
            };
            redis.setnx(poll_id, JSON.stringify(poll_obj)).then(function(result) {
                if (result === 0 ) {
                    // There was a collision with the generated poll_id and a poll_id in the database
                    reply(Boom.badRequest('Poll already exists. Please create a new poll.')); // TODO: Maybe it's possible to redirect user to /create with the same payload to simulate another request?
                } else if (result === 1){
                    // Store into PC's (Poll Creator) browser a cookie with var "poll" with the poll id and the 10 char generated password
                    var cookie_obj = {
                        poll_id: poll_id,
                        access_id: access_id
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
    // Check that data, and the poll_id and password are at least set
    if (typeof request.state.data === "undefined" || typeof request.state.data["poll_id"] === "undefined" || typeof request.state.data["access_id"] === "undefined") {
         return reply(Boom.badRequest('Cookie is invalid.'));
    }

    // All properties of cookies are set, read cookie
    var poll_cookie = request.state.data;
    var poll_obj = redis.get(poll_cookie.poll_id).then(function(result) {
        // If poll_id is not found, return error
        if (result === null) {
            return reply(Boom.notFound('Poll not found. Please create a new poll.'));
        }
        // Poll_id is found, compare password and allow viewing of results
        var poll_obj = JSON.parse(result);
        Bcrypt.compare(poll_cookie.access_id, poll_obj.access_id, function(err, result) {
            if (err || !result) {
                return reply(Boom.unauthorized('Unable to access the specified poll. Please create a new poll.'));
            }
            var poll_obj_public = {
                question: poll_obj.question,
                options: poll_obj.options
                };
                reply.view('view', {
                    title: 'View Poll results',
                    poll_obj: poll_obj_public
                });
            });
    });
}

var answerPoll = function(request, reply) {
    // Get poll object
    var poll_id = 'poll' + encodeURIComponent(request.params.poll_id);
    redis.get(poll_id).then(function(result) {
        if (result === null) {
            return reply(Boom.notFound('A poll with that poll id was not found.'));
        }
        console.log('test');
        var poll_obj = JSON.parse(result);
        console.log("poll obj", poll_obj);
    });
}

module.exports = {
    create: createPoll,
    view: viewResults,
    answer: answerPoll
}
