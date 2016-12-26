const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const app = require('../server');
const should = chai.should();
const faker = require('faker');



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
                transciption.should.include.keys('id', 'name', 'docText', 'date', 'dateUploaded', 'sessionNumber');
            });
            resTranscription = res.body.transcriptions[0];
            return Restaurant.findById
            })
        });
});

describe('POST resource', function () {
    it('Should insert a transciption in the databse on POST', function () {
        const newTranscription = {
            uploadedBy: faker.name.firstName + faker.name.lastName,
            name: faker.lorem.word,
            docText: faker.lorem,
            date: faker.date.past,
            dateuploaded: faker.date.recent,
            sessionNumber: faker.random
        }
        return chai.http.request(app)
        .post('/transcriptions')
        .then(function (res) {
            res.should.have.status(201);
            res.should.be.json;
            res.body.should.be.a('object');
            res.body.should.include.keys('name', 'uploadedBy', 'docText', 'date', 'dateUploaded', 'sessionNumber');
            res.body.name.should.equal(newTranscription.name);
            res.body.uploadedBy.should.equal(newTranscription.uploadedBy)
            res.body.docText.should.equal(newTranscription.docText);
            res.body.date.should.equal(newTranscription.date);
            res.body.dateuploaded.should.equal(newTranscription.dateuploaded);
            res.body.sessionNumber.should.equal(newTranscription.sessionNumber);
            return Transcriptions.findById(res.body.id)
            .exec();
        })
        .then (function (transcription){
            transcription.name.should.equal(newTranscription.name);
            transcription.uploadedBy.should.equal(newTranscription.uploadedBy)
            transcription.docText.should.equal(newTranscription.docText);
            transcription.date.should.equal(newTranscription.date);
            transcription.dateuploaded.should.equal(newTranscription.dateuploaded);
            transcription.sessionNumber.should.equal(newTranscription.sessionNumber);
        });
    });
});
