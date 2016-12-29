require('@risingstack/trace');

const bodyParser = require('body-parser');

const {router: usersRouter}  = require('./users');
const mongoose = require('mongoose');
const {router: transRouter} = require('./trans-router')
const express = require('express');


mongoose.Promise = global.Promise;

const app = express();

const {PORT, DATABASE_URL} = require('./config');

app.use(express.static('public'));
app.use(bodyParser.json());


app.use('/users/', usersRouter);

app.use('/transcriptions', transRouter);

let server;

function runServer () { 
    return new Promise((resolve, reject) => {
        mongoose.connect(DATABASE_URL, err => {
            if (err) {
                return reject(err);
            }
            server = app.listen(PORT, () => {
                console.log(`Your app is listening on port ${PORT}`);
                resolve();
            })
            .on('error', err => {
                mongoose.disconnect();
                reject(err);
            });
        })
        });
    };

function closeServer () {
    return mongoose.disconnect().then(() => {
        return new Promise((resolve, reject) => {
            console.log("closing server");
            server.close(err => {
                if (err) {
                    return reject(err);
                }
                resolve();
            });
    });
    });
}

if (require.main === module) {
    runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};