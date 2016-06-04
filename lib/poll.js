var Redis = require('ioredis');
var redis = new Redis('redis://:@pub-redis-16195.us-east-1-3.6.ec2.redislabs.com:16195');

var createPoll = function() {
    redis.set('poll', 'test');
}

var viewPoll = function() {
    return redis.get('poll').then((result) => { return result });
}

module.exports = {
    create: createPoll,
    view: viewPoll
}
