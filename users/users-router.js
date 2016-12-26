const {BasicStrategy} = require('passport-http');
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');

const {User} = require('./models');

const router = express.Router();

router.use(jsonParser);


var strategy = new BasicStrategy(function(username, password, callback) {
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

        user.validatePassword(password, function(err, isValid) {
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


//------New login
router.post('/users', function (req, res) {
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

    password = password.trim();

    if (password === '') {
        return res.status(422).json({
            message: 'Incorrect field length: password'
        });
    }

return User
    .find({username})
    .count()
    .exec()
    .then(count => {
      if (count > 0) {
        return res.status(422).json({message: 'username already taken'});
      }

      return User.hashPassword(password)
    })
    .then(hash => {
      return User
        .create({
          username: username,
          password: hash,
        })
    })
    .then(user => {
      return res.status(201).json({});
    })
    .catch(err => {
      res.status(500).json({message: 'Internal server error'})
    });
});


router.use(passport.initialize());

module.exports = router;