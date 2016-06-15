// This file will initalize and handle the socket.io and redis pubsub connections
const SocketIO = require('socket.io');
const Redis = require('ioredis');
const redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
const pub = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');
var io;

const init = function(listener) {
    console.log('came once');
    // Start socketIO connection
    io =  SocketIO.listen(listener);

    // Subscribe to answers
    redis.subscribe('poll:utw6i:answers');

    redis.on('message', function(channel, message) {
        console.log(channel +  ' : ' + message);
    });

    io.on('connection', (socket) => {
        console.log('a user connected');
        // When user submits answer, publish it to channel 'poll:id:answers' so that we can subscribe for changes
        socket.on('poll:answers', (msg) => {
            var poll_information = JSON.parse(msg);
            var poll_id = poll_information.poll_id;
            var answer = poll_information.answer; // TODO: Validate answer
            pub.publish('poll:' + poll_id + ':answers', answer);
        });
    });

}


module.exports = {
    init: init
}
