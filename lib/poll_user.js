// These functions are public (no authentication required), and are for the users responding to the poll (Poll Users, or PU)
const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const Boom = require('boom');

// View the poll itself, no auth, for poll users (PU)
var viewPoll = function(request, reply) {
    // Get poll object
    var poll_id = encodeURIComponent(request.params.poll_id);
    redis.get('poll:' + poll_id).then(function(result) {

        // Return error if poll is not found
        if (result === null) {
            return reply(Boom.notFound('A poll with that poll id was not found.'));
        }

        // Poll with the specified id is found, retrieve it and send to user to answer
        var poll_obj = JSON.parse(result);
        reply.view('answer', {
            title: 'Answer Poll',
            poll_obj: {
                question: poll_obj.question,
                options: poll_obj.options
            }
        });
    });

}


/*
var answerPoll = function(request, reply) {
    console.log('came into this function');
    io.on('connection', function(socket) {
        console.log('conneted', socket);
    });



    // Get poll id
    var poll_id = encodeURIComponent(request.params.poll_id);

    // Get user's answer
    // TODO: Validation: try/catch to make sure int is parsed correctly
    var answer = parseInt(request.payload.answer);

    // Make sure answer <= (options.length - 1)
    return redis.hgetall('poll:' + poll_id + ':answers').then(function(result) {
        return Object.keys(result).length;
    }).then(function(result) {
        if (answer > (result - 1)) {
            return reply(Boom.badRequest('Option does not exist! Please refreshing the poll.'));
        } else {
            return redis.hincrby('poll:' + poll_id + ':answers', request.payload.answer, 1);
        }
    }).then(function(result) {
        var response = {
            status: 'success',
            message: 'Answer posted to poll'
        }
        reply(JSON.stringify(response));
    });

}*/

module.exports = {
    view: viewPoll
};
