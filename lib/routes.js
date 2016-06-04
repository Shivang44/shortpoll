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
            reply('hello').state('data', { firstVisit: true });
        }
    },
    {
        // View Poll Results
        method: 'GET',
        path: '/view',
        handler: function (request, reply) {
            reply.file('./view.html');
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
