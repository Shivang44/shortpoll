// These functions are public (no authentication required), and are for the users responding to the poll (Poll Users, or PU)
const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const Boom = require('boom');
const pub = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');

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



var answerPoll = function(request, reply) {
    // Get poll id
    var poll_id = encodeURIComponent(request.payload.poll_id);

    // Get user's answer
    // TODO: Validation: try/catch to make sure int is parsed correctly
    //var answer = parseInt(request.payload.answer);
    var prev_value = parseInt(request.payload.prev_value);
    var new_value = parseInt(request.payload.new_value);

    redis.hincrby('poll:' + poll_id + ':answers', new_value, 1).then((result) => {
        // If previous answer and new answer are different, user is changing vote
        if (prev_value !== new_value) {
            return redis.hincrby('poll:' + poll_id + ':answers', prev_value, -1);
        } else {
            // Initial vote
            return;
        }
    }).then(function() {
        // Inform poll creater to fetch new answers
        pub.publish('poll:answers:new', poll_id);
        reply("Vote submitted");
        console.log("A user submitted an answer to a poll.");
    });


}

module.exports = {
    view: viewPoll,
    answer: answerPoll
};
