const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
// const Bcrypt = require('bcryptjs'); TODO: Implement authentication for /view endpoint
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

    // Generate poll id
    var poll_id = generatePollId();

    var poll_obj = {
        question: question,
        options: options,
    };

    // Store poll_id into database
    redis.setnx(poll_id, JSON.stringify(poll_obj)).then(function(result) {
        if (result === 0 ) {
            // There was a collision with the generated poll_id and a poll_id in the database
            reply(Boom.badRequest('Poll already exists. Please create a new poll.')); // TODO: Maybe it's possible to redirect user to /create with the same payload to simulate another request?
        } else if (result === 1){
            var cookie_obj = {
                poll_id: poll_id.substr(poll_id.indexOf(":") + 1),
            };
            reply(JSON.stringify(cookie_obj));
        }
    });

}

// View poll results, only poll creater can see this page
var viewResults = function(request, reply) {
    var poll_id = encodeURIComponent(request.params.poll_id);
    var poll_obj = redis.get('poll:' + poll_id).then(function(result) {

        // If poll_id is not found, return error
        if (result === null) {
            return reply(Boom.notFound('Poll not found. Please create a new poll.'));
        }

        // Poll_id is found, compare password and allow viewing of results
        var poll_obj = JSON.parse(result);

        // Render Template
        reply.view('view', {
            title: 'View Poll results',
            poll_obj: {
                question: poll_obj.question,
                options: poll_obj.options,
                poll_id: poll_id
            }
        });
    });
}

var answerPoll = function(request, reply) {
    // Get poll object
    var poll_id = encodeURIComponent(request.params.poll_id);
    redis.get('poll:' + poll_id).then(function(result) {

        // Return error if poll is not found
        if (result === null) {
            return reply(Boom.notFound('A poll with that poll id was not found.'));
        }

        // Poll with the specified id is found, retrieve it and send to user to answer
        var poll_obj = JSON.parse(result);
        console.log('answerPoll', poll_obj);
        reply.view('answer', {
            title: 'Answer Poll',
            poll_obj: {
                question: poll_obj.question,
                options: poll_obj.options
            }
        });
    });
}

module.exports = {
    create: createPoll,
    view: viewResults,
    answer: answerPoll
}
