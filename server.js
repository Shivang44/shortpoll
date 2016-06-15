'use strict';

const Hapi = require('hapi');
const Inert = require('inert');
const Vision = require('vision');
const Path = require('path');
const Hoek = require('hoek');
const Handlebars = require('handlebars');
const pubsub = require('./lib/pubsub.js');


const server = new Hapi.Server();


// Configure Server
server.connection({ port: ~~(process.env.PORT) });

// Register Inert for rendering static content
server.register(Inert, () => {});

// Configure cookies
server.state('data', {
    ttl: null,
    isSecure: false, // Set to true in production!
    isHttpOnly: true,
    encoding: 'base64json',
    clearInvalid: false,
    strictHeader: true
});

// Register Vision, which adds template rendering support to Hapi
server.register(Vision, (err) => {
    Hoek.assert(!err, err);
    server.views({
        engines: {
            html: Handlebars // We will be using handlebars for rendering templates
        },
        relativeTo: __dirname,
        path: 'templates'
    });
});



// Add routes
server.route(require('./lib/routes.js'));

// Start server
server.start((err) => {

    // Init websocket connections
    pubsub.init(server.listener);

    if (err) {
        throw err;
    }
    console.log('Server running at:', server.info.uri);
});

module.exports = server;
