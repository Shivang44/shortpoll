// These functions are for the poll creater (PC)

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
    // TODO: Validate with Joi that the parameter's aren't empty

    // Get question and options from user request
    var question = request.payload.question;

    // Workaround for now. For some reason the POST'd array name is either options or options[], depending on the client who sends it
    var options = typeof request.payload.options === "undefined" ? request.payload["options[]"] : request.payload.options;

    // Delete any empty options
    var options_temp = [];
    for (var i = 0; i < options.length; i++) {
        if (options[i] !== "") {
            options_temp.push(options[i]);
        }
    }
    options = options_temp;

    // Generate poll id
    var poll_id = generatePollId();

    var poll_obj = {
        question: question,
        options: options,
    };

    // Store poll_id into database
    redis.setnx(poll_id, JSON.stringify(poll_obj)).then(function(result) {

        if (result === 0 ) {
            // There was a collision with the generated poll_id and a poll_id in the database. VERY small chance of this happening.
            // TODO: Maybe it's possible to redirect user to /create with the same payload to simulate another request?
            // server.inject might work for this, to create a sort of recursive path down this route until result === 1 and a key is found
            reply(Boom.badRequest('Poll already exists. Please create a new poll.'));

        } else if (result === 1){

            return poll_id;

        }
    // Set answers hash
    }).then(function(poll_id) {

        // Set an empty hash field for the poll:id:answers key for each option
        for (var i = 0; i < options.length; i++) {
            redis.hset(poll_id + ':answers', i, 0);
        }

        reply(JSON.stringify({ poll_id: poll_id.substr(poll_id.indexOf(":") + 1) }));
    });
}

// View poll results, only poll creater (PC) can see this page
var viewResponses = function(request, reply) {
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

module.exports = {
    create: createPoll,
    view: viewResponses,
}
