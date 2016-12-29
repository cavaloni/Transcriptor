const {BasicStrategy} = require('passport-http');
const express = require('express');
const jsonParser = require('body-parser').json();
const passport = require('passport');

const User = require('./user-models');

const router = express.Router();

router.use(jsonParser);

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  User.findById(id, function(err, user) {
    done(err, user);
  });
});

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

    password = password.trim();

    if (password === '') {
        return res.status(422).json({
            message: 'Incorrect field length: password'
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

function handleResponse(res, code, statusMsg) {
  res.status(code).json({status: statusMsg});
}

router.post('/login', 
    passport.authenticate('basic', {session: true}), 
  (req, res) => res.json({user: req.user})
);



module.exports = router;