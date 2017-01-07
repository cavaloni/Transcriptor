const {BasicStrategy} = require('passport-http');
const express = require('express');
const {Transcriptions} = require('./models');
const User = require('./users/user-models');
const session = require('express-session');
const multer = require('multer');
const jsonParser = require('body-parser').json();
const passport = require('passport');
const textract = require('textract');
const textSearch = require('mongoose-text-search');
const path = require('path');

const router = express.Router();

router.use(jsonParser);

//Multer is storage pacakge for storing files on the server
const storage = multer.diskStorage({
 destination: function(req, file, cb) {
 cb(null, 'uploads/')
 },
 filename: function(req, file, cb) {
 cb(null, file.originalname);
 }
});
 
const upload = multer({
 storage: storage
});


//Project Handling
function getProjectName(user) {  
     let project;
     User.findOne({
         username: user
    })
    .exec()
    .then(_user => {  
        console.log(_user);
        project = _user.project
    }).catch(function (err) {  
        console.log(err);
    });
    console.log(project);
    return project
}


//middleware to protect endpoints using passport
var isAuthenticated = function (req, res, next) {
  if (req.isAuthenticated()) {
    console.log('***********AUTHORIZED');
    return next();
  }
    console.log('~~~~not authenticated~~~~~');
}

//------------------------endpoints

router.get('/', isAuthenticated, 
    (req, res) => {
                Transcriptions
                    .find()
                    .sort({dateUploaded: -1})
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
                                message: 'My Internal Server Error'
                            });
                        });
    }
    );

router.post('/search', isAuthenticated,
    (req, res) => {
       Transcriptions
            .find({ $text : { $search : req.body.search }}, function(err,results){
                if (err) {console.log(err);}
                console.log(results + '/////////////');
                res.send(results);
            })
            })
    

router.get('/:userid', isAuthenticated, 
    (req, res) => {    
        console.log('========================================================');
        Transcriptions
            .find({
                projectName: req.user.project,
                uploadedBy: req.params.userid
            })
            .sort({dateUploaded: -1})
            .limit(10)
            .exec()
            .then(transcriptions => {
                res.json({transcriptions: 
                    transcriptions.map((transcription =>
                        transcription.apiRepr()))
                });
            })
            .catch(err => {console.log(err);})    
    });

router.get('/download/:name', isAuthenticated, 
    (req, res) => {
        console.log(req.user.project);
        console.log(req.params.name);
        Transcriptions
            .findOne({
                projectName: req.user.project,
                name: req.params.name
            })
            .exec()
            .then(transcription => {                
                res.download(path.join(__dirname, './', `${transcription.filepath.path}`));
            })
            .catch(err => {console.log(err);})
    });

router.post('/upload/:id', isAuthenticated, upload.any(), (req, res) => {
    console.log('got to heeeeeeeeeeeeeeeeerrrrrrrrrrrrrrrrrreeeeeeeeeeeeee');
    const requiredFields = ['name', 'date', 'sessionNumber'];
    requiredFields.forEach(field => {
        if (!(field in req.body) || !(req.files)) {
            res.status(400).json({
                error: `Missing "${field}" in request body`
            });
        }
    });

    //Word document file upload file path handling
    var path = req.files[0].path;
    var fileName = req.files[0].originalname;
    var filepath = {};
    filepath['path'] = path;
    filepath['originalname'] = fileName;

    ///text extractor
    let docText;
    new Promise((resolve, reject) => {
        textract.fromFileWithPath(__dirname + `\\uploads\\${fileName}`, function (err, text) {
            console.log(err); 
            docText = text;
            resolve();
        })
    }).then(() => {
        Transcriptions
            .create({
                projectName: req.user.project,
                name: req.body.name,
                uploadedBy: req.params.id,
                docText: docText,
                date: req.body.date,
                dateUploaded: Date.now(),
                sessionNumber: req.body.sessionNumber,
                filepath: filepath
            })
            .then(transcription => res.status(201).json(transcription.apiRepr()))
            .catch(err => {
                res.status(500).json({
                    error: 'Something went wrong'
                });
            });
    })
})

router.post('/:id', isAuthenticated, upload.any(),
    (req, res) => {
    console.log(req.body);
    if (!(req.params.id === req.body.id)) {
        res.status(400).json({
            error: 'Request path id and request body id values must match'
        });
    }
    const update = {};
    const updatableFields = ['name', 'docText', 'date', 'sessionNumber'];
    updatableFields.forEach(field => {
        if(field in req.body && req.body[field] !== '') {
            update[field] = req.body[field];
        } 
    });

    if (req.files.length > 0) {
        var path = req.files[0].path;
        var fileName = req.files[0].originalname;
        var thisfilepath = {};
        filepath['path'] = path;
        filepath['originalname'] = fileName;

        ///text extractor
        let thisdocText;
        new Promise((resolve, reject) => {
                textract.fromFileWithPath(__dirname + `\\uploads\\${fileName}`, function (err, text) {
                    console.log(err);
                    thisdocText = text;
                    resolve();
                })
            }).then(() => {
                update[filepath] = thisfilepath;
                update[docText] = thisdocText;
            })
    }

    Transcriptions
        .findByIdAndUpdate(req.params.id, {$set: update}, {new: true})
        .exec()
        .then(updatedTrans => res.status(201).json(updatedTrans.apiRepr()))
        .catch(err => res.status(500).json({message: err.errors}));
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