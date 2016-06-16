// This file will initalize and handle the socket.io and redis pubsub connections
const SocketIO = require('socket.io');
const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const sub = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const pub = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
var io;

const init = function(listener) {
    // Start socketIO connection
    io =  SocketIO.listen(listener);

    sub.on('message', function(channel, message) {

        var split_channel = channel.split(":");

        // If the channel is answers, there are new answers. Send them to poll creater results page.
        if (split_channel[0] === "answers") {
            var poll_id_answers = 'poll:' + split_channel[1] + ':answers';
            redis.hgetall(poll_id_answers).then((result) => {
                console.log('sent');
                io.emit(poll_id_answers, result);
            });

        }
    });

    io.on('connection', (socket) => {

        // When user submits answer, publish it to channel 'poll:id:answers' so that we can subscribe for changes
        socket.on('poll:answers', (msg) => {
            // Get poll information and answer
            var poll_information = JSON.parse(msg);
            var poll_id = poll_information.poll_id;
            var answer = poll_information.answer; // TODO: Validate answer. Should be [0, options.length -  1]
            var vote = poll_information.vote;
            var vote_type = poll_information.vote_type;

            // Update options vote score in  relevant poll object
            redis.hincrby('poll:' + poll_id + ':answers', answer, vote).then((result) => {
                // Inform poll creater to fetch new answers
                if (vote_type !== "unset") {
                    pub.publish('answers:' + poll_id, answer);
                }
            });
        });


        // When poll creater loads results page, send the poll id so we know which channel to sub to
        socket.on('poll:view:responses', (msg) => {
            // Subscribe to answers based on poll id
             // TODO: Validate poll_id
            sub.subscribe('answers:' + msg);
        });


    });

}


module.exports = {
    init: init
}
