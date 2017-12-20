/* requires */
const chalk = require('chalk');
const request = require('request');
const express = require('express');
const bodyParser = require('body-parser');
const app = express();

/* middleware */
app.use(bodyParser.json());

/* vars */
const port = process.env.PORT == undefined ? 3000 : process.env.PORT;
/* why is this not getting sent? */
const secret = process.env.SECRET == undefined ? 'password' : process.env.SECRET;
const auth_token = process.env.AUTH_TOKEN == undefined ? 'words' : process.env.AUTH_TOKEN;
const debug_mode = process.env.DEBUG_MODE != undefined;

/* webhook handler */
app.post('/webhook', function (req, res) {
    // log webhook info
    console.log('[' + chalk.blue('INF') + '] PR #' + req.body.number + ' to ' + req.body.repository.full_name + ' ' + req.body.action + ' by ' + req.body.sender.login);

    // reply ok
    res.send('OK!');

    // only merge if opened event
    if (req.body.action != 'opened') return;

    // log debug info
    if (debug_mode) console.log(req.body);

    // send HTTP request
    request({
        // proper URL
        url: 'https://api.github.com/repos/' + req.body.repository.full_name + '/pulls/' + req.body.number + '/merge',
        method: 'PUT',
        headers: {
            // authorization token + user agent
            'Authorization': 'token ' + auth_token,
            'User-Agent': 'sendprshere-bot via request'
        },
        json: {
            // json stuff
            commit_title: 'Merge pull request #' + req.body.number + ' from ' + req.body.sender.login,
            commit_message: req.body.pull_request.body,
            sha: req.body.pull_request.head.sha,
            merge_method: 'merge'
        }
    }, function(error, request, body) {
        if (error) {
            console.log(error);
        } else {
            console.log('[' + chalk.green('YAY') + '] PR #' + req.body.number + ' to ' + req.body.repository.full_name + ' merged!');
        }
    });
    
    // send encouraging comment
    request({
        // proper URL
        url: 'https://api.github.com/repos/' + req.body.repository.full_name + '/issues/' + req.body.number + '/comments',
        method: 'POST',
        headers: {
            // authorization token + user agent
            'Authorization': 'token ' + auth_token,
            'User-Agent': 'sendprshere-bot via request'
        },
        json: {
            // json stuff
            body: 'Thanks for your pull request, @' + req.body.sender.login + '!\r\nYour contribution is greatly appreciated :)'
        }
    }, function(error, request, body) {
        if (error) {
            console.log(error);
        } else {
            console.log('[' + chalk.green('YAY') + '] Commented on PR #' + req.body.number + ' to ' + req.body.repository.full_name);
        }
    });
});

app.use(function(req, res) {
    console.log('[' + chalk.red('ERR') + '] ' + req.method + ' ' + req.url);
    res.status(404).send('Cannot ' + req.method + ' ' + req.url);
});

if (debug_mode) console.log('[' + chalk.blue('INF') + '] Debug mode.');

/* listen on configured port */
app.listen(port, () => console.log('[' + chalk.blue('INF') + '] Example app listening on port ' + port + '!'));
