
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

router.post('/login',  function(req, res, next) {
    passport.authenticate('basic', function (err, account) {
    req.logIn(account, function() {
        res.status(err ? 500 : 200).send(err ? err : account);
    });
})(req, res, next)
});


module.exports = router;