var poll_admin = require('./poll_admin.js');
var poll_user = require('./poll_user.js');

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
        handler: poll_admin.create
    },
    {
        // View Poll Results. Must be authenticated to the user who created the poll
        method: 'GET',
        path: '/view/{poll_id}',
        handler: poll_admin.view
    },
    {
        // Answer poll. Fully public, no authetnication required (anyone with poll_id can answer)
        method: 'GET',
        path: '/{poll_id}',
        handler: poll_user.view
    },
    {
        // Submit answer to poll. Again, no auth required for this endpoint
        method: 'POST',
        path: '/{poll_id}',
        handler: poll_user.answer
    }
];

module.exports = routes;
