// This file will initalize and handle the socket.io and redis pubsub connections
const SocketIO = require('socket.io');
const Redis = require('ioredis');
const redis = new Redis(process.env.REDIS_URL);
const sub = new Redis(process.env.REDIS_URL);
const pub = new Redis(process.env.REDIS_URL);
var io;

const init = function(listener) {
    console.log("initied pubsub");
    // Start socketIO connection
    io =  SocketIO.listen(listener);

    // Subscribe to poll:answers:new channel, in which each message is the poll_id for which there are new answers
    sub.subscribe('poll:answers:new');


    // First, we need to connect to relevant poll creator
    io.on('connection', (socket) => {
        // Send initial responses (client will ask for these)
        // This also "registers" the poll_id so thta we know where to send updated answers to
        socket.on('poll:view:responses', (poll_id) => {
            var poll_id_answers = 'poll:' + poll_id + ':answers';
            redis.hgetall(poll_id_answers).then((result) => {
                io.emit(poll_id_answers, result);
                console.log("Sent initial answers to poll creator.");
            }).then(() => {
                // Everytime there is a new vote, send it to the relevant poll creater (client)
                sub.on('message', function(channel, message) {
                    if (message === poll_id) {
                        redis.hgetall(poll_id_answers).then((result) => {
                            io.emit(poll_id_answers, result);
                            console.log("Sent new answers to poll creator.");
                        });
                    }
                });
            });
        });
    });
}


module.exports = {
    init: init
}
