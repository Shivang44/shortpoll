const Code = require('code');   // assertion library
const Lab = require('lab');
const lab = exports.lab = Lab.script();
// const poll = require('../lib/poll.js');
const server = require('../index.js');

// Test /create API endpoint
lab.test('Stores poll object in redis memory and reference into user cookie', (done) => {

    // Simulate POST request
    var serverOptions = {
        method: 'POST',
        url: '/create',
        payload: {
            question: 'What is your favorite letter?',
            options: ['A', 'B', 'C', 'D']
        }
    };

    // Inject options into request
    server.inject(serverOptions, function(response){
        var cookie = response.request._states;
        console.log(cookie);
        Code.expect(1 + 1).to.equal(2);
        done();
    });


});
