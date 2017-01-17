require('@risingstack/trace'); //tool for debugging node apps

const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const mongoose = require('mongoose');
const express = require('express');
const User = require('./users/user-models');
const {router: usersRouter}  = require('./users');
const {router: transRouter} = require('./trans-router')
const {BasicStrategy} = require('passport-http');


mongoose.Promise = global.Promise;

const app = express();

const {PORT, DATABASE_URL} = require('./config');

app.disable('etag');

app.use(express.static('public'));

app.use(cookieParser('S3CRE7'));
app.use(bodyParser.json());
app.use(session( {
  saveUninitialized: true, // saved new sessions
  resave: false, // do not automatically write to the session store
  secret: 'kitty cat',
  cookie : { httpOnly: true, maxAge: 2419200000 } // configure when sessions expires
}));
app.use(passport.initialize());
app.use(passport.session());


// passport authorization functions
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

app.use('/users/', usersRouter);
passport.use(basicStrategy);
app.use('/transcriptions', transRouter);

let server; //Define server here so that the same instance of server
            //is accessible in both functions

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