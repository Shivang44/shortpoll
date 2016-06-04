var poll = require('./poll.js');

var routes = [
    {
        // Initial view, ask for question and answers
        method: 'GET',
        path: '/',
        handler: function (request, reply) {
            reply.view('index', {
                title: 'Create a live poll'
            });
        }
    },
    {
        method: 'POST',
        path: '/create',
        handler: function (request, reply) {
            poll.create();
            reply().state('data', { firstVisit: true }).redirect('/view');
        }
    },
    {
        // View Poll Results
        method: 'GET',
        path: '/view',
        handler: function (request, reply) {
            reply(poll.view());
        }
    },
    {
        // Answer Poll
        method: 'GET',
        path: '/answer',
        handler: function (request, reply) {
            reply.file('./answer.html');
        }
    }
];

module.exports = routes;
