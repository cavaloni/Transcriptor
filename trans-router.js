const {BasicStrategy} = require('passport-http');
const express = require('express');
const {Transcriptions} = require('./models');
const User = require('./users/user-models');
const session = require('express-session');

const jsonParser = require('body-parser').json();
const passport = require('passport');

const router = express.Router();

router.use(jsonParser);

router.use(session({ secret: 'keyboard cat',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: true }
 }));



const basicStrategy = new BasicStrategy(function(username, password, callback) {
  let user;
  User
    .findOne({username: username})
    .exec()
    .then(_user => {
      user = _user;
      if (!user) {
        return callback(null, false, {message: 'Incorrect username'});
      }
      return user.validatePassword(password);
    })
    .then(isValid => {
      if (!isValid) {
        return callback(null, false, {message: 'Incorrect password'});
      }
      else {
        return callback(null, user)
      }
    });
});

passport.use(basicStrategy);
router.use(passport.initialize());
router.use(passport.session());

router.get('/', 
    passport.authenticate('basic', {session: true}),
    (req, res) => {
        Transcriptions
            .find()
            .limit(10)
            .exec()
            .then(transcriptions => {
                let foo = transcriptions.map( 
                        (transcription) => transcription.apiRepr());
                res.json(foo);
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
                name: userid
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

router.post('/', (req, res) => {
    const requiredFields = ['name', 'docText', 'date', 'dateUploaded', 'sessionNumber'];
    requiredFields.forEach(field => {
        if (!(field in req.body)) {
        res.status(400).json(
            {error: `Missing "${field}" in request body`});
    }});
    Transcriptions
        .create ({
            name : req.body.name,
            uploadedBy: req.param.id || req.body.uploadedBy,
            docText: req.body.docText,
            date: req.body.date,
            dateUploaded: req.body.dateUploaded,
            sessionNumber: req.body.sessionNumber
        })
         .then(transcription => res.status(201).json(transcription.apiRepr()))
            .catch(err => {
        console.error(err);
        res.status(500).json({error: 'Something went wrong'});
    });
})

router.put('/:id',  (req, res) => {
    if (!(req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'Request path id and request body id values must match'
        });
    }
    const update = {};
    const updatableFields = ['name', 'docText', 'date', 'sessionNumber'];
    updatableFields.forEach(field => {
        if(field in req.body) {
            update[field] = req.body[field];
        }
    });
    Transcriptions
        .findByIdAndUpdate(req.params.id, {$set: update}, {new: true})
        .exec()
        .then(updatedTrans => res.status(201).json(updatedTrans.apiRepr()))
        .catch(err => res.status(500).json({message: 'Something went wrong'}));
});

router.delete('/:id', (req, res) => {
    Transcriptions
        .findByIdAndRemove(req.params.id)
        .exec()
        .then(() => {
        console.log(`Deleted Post with id \"${req.params.id}\"`);
        res.status(204).end();
        });
});



module.exports = {router};