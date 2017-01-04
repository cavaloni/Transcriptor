
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const session = require('express-session');
const cookieParser = require('cookie-parser');

const User = require('./user-models');

const router = express.Router();



router.use(jsonParser);




//------New user
router.post('/', function (req, res) {
    console.log(`Request Body : ${req.body}`);
    if (!req.body) {
        return res.status(400).json({
            message: `No request body`
        });
    }
    console.log(req.body);
    if (!('username' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: username'
        });
    }

    var username = req.body.username;

    if (typeof username !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: username'
        });
    }

    username = username.trim();

    if (username === '') {
        return res.staus(422).json({
            message: 'Incorrect field length: username'
        });
    }

    var password = req.body.password;

    if (!('password' in req.body)) {
        return res.status(422).json({
            message: 'Missing field: password'
        })
    }

    if (typeof password !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: password'
        });
    }

    if (password.length < 6 || password.length > 15) {
        return res.status(422).json({
            message: 'Password needs to be at least 6 characters and not more than 15'
        });
    }

    password = password.trim();

    if (password === '') {
        return res.status(422).json({
            message: 'Incorrect field length: password'
        });
    }

    var project = req.body.project;

    if (!(project) in req.body) {
        return res.status(422).json({
            message: 'Missing field: project'
        });
    }

    if (typeof project !== 'string') {
        return res.status(422).json({
            message: 'Incorrect field type: project'
        });
    }

    project = project.trim();

    if (project === '') {
        return res.status(422).json({
            message: 'Incorrect field length: username'
        });
    }

    return User
        .find({
            username
        })
        .count()
        .exec()
        .then(count => {
            if (count > 0) {
                return res.status(422).json({
                    message: 'username already taken'
                });
            }

            return User.hashPassword(password)
        })
        .then(hash => {
            return User
                .create({
                    username: username,
                    password: hash,
                    project: project
                })
        })
        .then(user => {
            return res.status(201).json({});
        })
        .catch(err => {
            res.status(500).json({
                message: 'Internal server error'
            })
        });
});

router.post('/login', function(req, res, next) {
  passport.authenticate('basic', function(err, user, info) {
    if (err) { return console.log('somethind done did went wroned'); }
    if (!user) { return res.redirect('/login'); }
    req.logIn(user, function(err) {
      if (err) { return console.log('somethind done did went wroned'); }
      console.log('logged in');
      return res.status(200).json({project: user.project});
    });
  })(req, res, next);
});


module.exports = router;