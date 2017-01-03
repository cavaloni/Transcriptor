const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const {app, runServer, closeServer} = require('../server');
const should = chai.should();
const faker = require('faker');
const {Transcriptions} = require('../models');
const {User} = require('../users/index.js');
const bcrypt = require('bcryptjs');
const expect = chai.expect;
const tester = require("supertest-as-promised").agent;
var superagent = require('superagent');
var agent = superagent.agent();


chai.use(chaiHttp);

function generateName () {
    return faker.name.firstName();
}

function generateText () {
    return faker.lorem.paragraphs();
}

function generateDate () {
    return faker.date.past();
}

function generateNumber () {
    return faker.random.number();
}


function seedUser() {
    console.log('seeding user data');
    const salt = bcrypt.genSaltSync();
    const hash = bcrypt.hashSync('johnson123', salt);
    let user ={
            username: 'henry',
            password: hash
        };      
    return User.create(user);
}

function generateTranscriptionData () {
    return {
        name: generateName(),
        docText: generateText(),
        date: generateDate(),
        dateUploaded: generateDate(),
        sessionNumber: generateNumber(),
        uploadedBy: generateName(),
        filepath: {
            path: generateName(),
            originalname: generateName()
        }
}
}

function seedTransData() {
    console.log('seeding transcription data');
    const seedData = [];

    for (let i = 0; i <= 10; i++) {
        seedData[i] = generateTranscriptionData();
    }
    return Transcriptions.insertMany(seedData);
    
};

function tearDownDB() {
    return new Promise((resolve, reject) => {
        console.warn('delete database');
        mongoose.connection.dropDatabase()
            .then(result => resolve(result))
            .catch(err => reject(err));
    });
}


describe('Transcriptor API resource', function () {

let cookie;

    before(function () {
        return runServer();
    });

    beforeEach(function () {
        return seedTransData();
    });
    

    beforeEach(function () {
        return seedUser();
    })


    after(function () {
        return closeServer();
    });

    afterEach(function () {
        return tearDownDB();
    });

    beforeEach(function() {
      return tester(app)
        .post('/users/login')
        .send({
          username: 'henry',
          password: 'johnson123'
        })
        .auth('henry', 'johnson123')
        .expect(200)
        .expect('Content-Type', /json/)
        .then(function(res) {
          cookie = res.headers['set-cookie'];
        });
    });
    
    // describe('New user', function () {  
    //     it('should register a new user', function () {  
    //         return tester(app)
    //             .post('/users')
    //             .send({
    //                 username: 'george',
    //                 password: 'mainstay'
    //             })
    //             .then(function (res) {  
    //                 res.should.have.status(201)
    //                 res.should.be.json;
    //             });
    //     });
    // })

    // describe('User login endpoint', function () {  
    //     it('should log a user in', function () {  
    //         return tester(app)
    //             .post('/users/login')
    //             .send({
    //                 username: 'henry',
    //                 password: 'johnson123'
    //             })
    //             .auth('henry', 'johnson123')
    //             .then(function (res) {                   
    //                 res.should.have.status(200);
    //             });
    //     });
    // });


    describe('GET Resource', function () {
    // it('should return all transcriptions in databse on GET', function () {
    //      return tester(app) //First log user in
    //         .post('/users/login')
    //         .auth('henry', 'johnson123')
    //         .send({
    //                 username: 'henry',
    //                 password: 'johnson123'
    //             })
    //         .then(function (res) {
    //             cookie = res.headers['set-cookie'];
    //             console.log('this worked before-----------------');
    //             res.should.have.status(200);
    //             expect(res).to.have.cookie('connect.sid');
    //         });
            
    // });

    it('should get ', function () {  
        return tester(app)
                    .get('/transcriptions')
                    .set('cookie', cookie)
                    .then(function (res) {
                        console.log('this worked-**********----------------');
                        res.should.have.status(200);
                        res.should.be.json;
                        res.body.transcriptions.should.have.lenght.of.at.least(1);
                        return Transcriptions.count();
                    })
                    .then(count => {
                        res.body.transcriptions.should.have.length.of(count);

                    })
                    .catch(err => console.error(err));  
    })

   
        it('should return transcriptions with the right fields', function () {
            let resTranscription;
            return tester(app)
                .get('/transcriptions')
                .set('cookie', cookie)
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.should.have.length.of.at.least(1);
                    res.body.forEach(function (transcription) {
                        transcription.should.be.a('object');
                        transcription.should.include.keys('id', 'name', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                    });
                    resTranscription = res.body[0];
                    return Transcriptions.findById(resTranscription)
                    .then(function (transcription) {  
                        transcription.forEach((item) => {
                            item.id.should.equal(resTranscription.id);
                            item.name.should.equal(resTranscription.name);
                            item.sessionNumber.should.equal(resTranscription.sessionNumber);
                        });
                    });
                });
        });
    });

    describe('GET resource for searching', function () {  
        it('should return a search query', function () {  
            const query = 'people talk'
            return tester(app)
                .get('/transcriptions/search')
                .send({searchTerm: query})
                .then(function (res) {  
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys('name', 'uploadedBy', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                })
            })
    })

    describe('POST resource for transcriptions', function () {
        it('Should insert a transciption in the databse on POST', function () {
            const newTranscription = {
                uploadedBy: generateName(),
                name: generateName(),
                docText: generateText(),
                date: generateDate(),
                dateUploaded: generateDate(),
                sessionNumber: generateNumber()
            };
            return tester(app)
                .post('/transcriptions')
                .send(newTranscription)
                .then(function (res) {
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys('name', 'uploadedBy', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                    res.body.name.should.equal(newTranscription.name);
                    res.body.uploadedBy.should.equal(newTranscription.uploadedBy)
                    res.body.docText.should.equal(newTranscription.docText);
                    res.body.sessionNumber.should.equal(newTranscription.sessionNumber);
                    return Transcriptions.findById(res.body.id)
                    .exec();
                })
                .then(function (transcription) {
                    transcription.name.should.equal(newTranscription.name);
                    transcription.uploadedBy.should.equal(newTranscription.uploadedBy)
                    transcription.docText.should.equal(newTranscription.docText);
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

                    return tester(app)
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
                .then(function (transcription)  {
                    transcriptionTD = transcription;
                    return tester(app).delete(`/transcriptions/${transcriptionTD.id}`);
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