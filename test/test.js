const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const should = chai.should();



chai.use(chaiHttp);

describe ('Transcription API resource', function () {
    it('should return status 200 on start', function () {
        return chai.request(app)
            .get('/')
            .end(function (res) {
                res.should.have.status(200);
                res.should.be.html;
            });
            done();
    });
});

describe ('GET Resource', function () {
    it('should return all transcriptions in databse on GET', function () {
        return chai.http.request(app)
            .get('/transcriptions')
            .end(function (res) {
                res.should.have.status(200);
                res.should.be.json;
                res.body.transcriptions.should.have.lenght.of.at.least(1);
                return Transcriptions.count();
            })
            .then(count => {
                res.body.transcriptions.should.have.length.of(count);
                done();
            })
            .catch(err => console.error(err));
    });

    it ('should return transcriptions with the right fields', function() {
        return chai.http.request(app)
        .get('/transcriptions')
        .then(function (res) {
            res.should.have.status(200);
            res.should.be.json;
            res.body.transcriptions.should.be.a('array');
            res.body.transcriptions.should.have.lenght.of.at.least(1);
            
            res.body.transcriptions.forEach(function (transcription){
                transciption.should.be.a('object');
                transciption.should.include.keys('id', 'name', 'docText', 'date', 'dateuploaded', 'sessionNumber');
            });
            resTranscription = res.body.transcriptions[0];
            return Restaurant.findById
            })
        }))
    })
})
