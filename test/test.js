const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const {app, runServer, closeServer} = require('../server');
const should = chai.should();
const faker = require('faker');
const Transcriptions = require('../models');


chai.use(chaiHttp);

describe('Transcriptor API resource', function () {

    before(function () {
        return runServer();
    });

    // beforeEach(function () {
    //     return seedBlogData();
    // });

    after(function () {
        return closeServer();
    });

    // afterEach(function () {
    //     return tearDownDB();
    // });

    describe('Transcription API resource', function () {
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

    describe('GET Resource', function () {
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

        it('should return transcriptions with the right fields', function () {
            return chai.http.request(app)
                .get('/transcriptions')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.transcriptions.should.be.a('array');
                    res.body.transcriptions.should.have.lenght.of.at.least(1);

                    res.body.transcriptions.forEach(function (transcription) {
                        transciption.should.be.a('object');
                        transciption.should.include.keys('id', 'name', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                    });
                    resTranscription = res.body.transcriptions[0];
                    return Transcriptions.findById
                })
        });
    });

    describe('POST resource for transcriptions', function () {
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
                .then(function (transcription) {
                    transcription.name.should.equal(newTranscription.name);
                    transcription.uploadedBy.should.equal(newTranscription.uploadedBy)
                    transcription.docText.should.equal(newTranscription.docText);
                    transcription.date.should.equal(newTranscription.date);
                    transcription.dateuploaded.should.equal(newTranscription.dateuploaded);
                    transcription.sessionNumber.should.equal(newTranscription.sessionNumber);
                });
        });
    });

    describe('PUT resource for transcriptions', function () {
        it('Should update transcriptions on PUT', function () {
            const update = {
                name: faker.name,
                sessionNumber: faker.random,
                docText: faker.Lorem,
            };
            Transcriptions
                .findOne()
                .then(function (trans) {
                    update = trans.id

                    return chai.request(app)
                        .put(`/transcriptions/${trans.id}`)
                        .send(update)
                })
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    return Transcriptions.findById(update.id)
                        .exec()
                })
                .then(function (trans) {
                    trans.name.should.equal(update.name);
                    trans.sessionNumber.should.equal(update.sessionNumber);
                    trans.docText.should.equal(update.docText);
                });
        });
    });

    describe('DELETE resource for transcriptions', function() {
        it('Should remove transcriptions on DELETE', function () {
            let transcriptionTD;
            return Transcriptions
                .findOne()
                .then(function (transctiption)  {
                    transcriptionTD = transcription;
                    return chai.request(app).delete(`/transcriptions/${transcriptionTD.id}`);
                })
                .then(function(res) {
                    res.should.have.status(204);
                    return Transcriptions.findById(transcriptionTD.id);
                })
                .then(function (transciption) {
                    should.not.exist(transciption)
                });
        });
    });

});