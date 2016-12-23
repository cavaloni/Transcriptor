const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const Transcriptions = require('.models');

app.use(express.static('public'));
app.use(bodyParser.json());

app.get ('/transcriptions', (req, res) => {
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
                res.status(500).json({message: 'Internal Server Error'});
        });
});



app.listen(process.env.PORT || 8080);

exports.app = app;