// This file will initalize and handle the socket.io and redis pubsub connections
const SocketIO = require('socket.io');
const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const sub = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const pub = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
var io;

const init = function(listener) {
    console.log("initied pubsub");
    // Start socketIO connection
    io =  SocketIO.listen(listener);

    io.on('connection', (socket) => {

        //// For the poll user
        // When user submits answer, publish it to channel 'poll:id:answers' so that we can subscribe for changes
        socket.on('poll:answers', (msg) => {
            // Get poll information and answer
            var poll_information = JSON.parse(msg);
            var poll_id = poll_information.poll_id;
            var prev_value = poll_information.prev_value; // TODO: Validate answer. Should be [0, options.length -  1]
            var new_value = poll_information.new_value;

            // Update options vote score in relevant poll object for the new poll vote
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
                pub.publish('answers:' + poll_id, new_value);
            });
        });

        //// For the poll creater
        // When poll creater loads results page, send the poll id so we know which channel to sub to
        socket.on('poll:view:responses', (msg) => {
            // Send intial database
            pub.publish('answers:' + msg, "");

            // Subscribe to answers channel based on retrieved poll id
             // TODO: Validate poll_id
            sub.subscribe('answers:' + msg);
        });


    });

    sub.on('message', function(channel, message) {
        var split_channel = channel.split(":");

        // If the channel is answers, there are new answers. Send these to poll creater results page.
        if (split_channel[0] === "answers") {
            var poll_id_answers = 'poll:' + split_channel[1] + ':answers';
            redis.hgetall(poll_id_answers).then((result) => {
                io.emit(poll_id_answers, result);
            });

        }
    });

}


module.exports = {
    init: init
}
