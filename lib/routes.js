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
        // This endpoint creates and outputs the created poll object in JSON
        method: 'POST',
        path: '/create',
        handler: poll.create
    },
    {
        // View Poll Results. Must be authenticated to the user who created the poll
        method: 'GET',
        path: '/view/{poll_id}',
        handler: poll.view
    },
    {
        // Answer poll. Fully public, no authetnication required (anyone with poll_id can answer)
        method: 'GET',
        path: '/{poll_id}',
        handler: poll.answer
    }
];

module.exports = routes;
