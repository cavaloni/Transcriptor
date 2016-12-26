const express = require('express');
const Transcriptions = require('./models');

const jsonParser = require('body-parser').json();
const passport = require('passport');

const router = express.Router();

router.use(jsonParser);

var strategy = new BasicStrategy(function (username, password, callback) {
    User.findOne({
        username: username
    }, function (err, user) {
        if (err) {
            callback(err);
            return;
        }

        if (!user) {
            return callback(null, false, {
                message: 'Incorrect username.'
            });
        }

        user.validatePassword(password, function (err, isValid) {
            if (err) {
                return callback(err);
            }

            if (!isValid) {
                return callback(null, false, {
                    message: 'Incorrect password.'
                });
            }
            return callback(null, user);
        });
    });
});

passport.use(strategy);


router.get('/', (req, res) => {
        Transcriptions
            .find()
            .limit(10)
            .exec()
            .then(transcriptions => {
                res.json({
                    transcriptions: transcriptions.map(
                        (transcription) => transcription.apiRepr())
                });
            })
            .catch(
                err => {
                    console.error(err);
                    res.status(500).json({
                        message: 'Internal Server Error'
                    });
                });
    });

router.get('/:userid', (req, res) => {
        Transcriptions
            .find({
                username: userid
            })
            .limit(10)
            .exec()
            .then(transcriptions => {
                res.json({
                    transcriptions: transcriptions.map((transcriptions =>
                        transcription.apiRepr()))
                });
            });
    })

router.post('/:userid', (req, res) => {
    const requiredFields = ['name', 'docText', 'date', 'dateUploaded', 'sessionNumber'];
    requiredFields.forEach(field => {
        if (!(field in req.body)) {
        res.status(400).json(
            {error: `Missing "${field}" in request body`});
    }});
    Transcriptions
        .create ({
            name : req.body.name,
            docText: req.body.docText,
            date: req.body.date,
            dateUploaded: req.body.dateUploaded,
            sessionNumber: req.body.sessionNumber
        })
         .then(transcription => res.status(201).json(Transcriptions.apiRepr()))
            .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
})



router.use(passport.initialize());

module.exports = router;