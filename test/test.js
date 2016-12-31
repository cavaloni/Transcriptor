const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const {app, runServer, closeServer} = require('../server');
const should = chai.should();
const faker = require('faker');
const {Transcriptions} = require('../models');
const {User} = require('../users/index.js');
const bcrypt = require('bcryptjs');


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
    console.log(user);       
    return User.create(user);
}

function generateTranscriptionData () {
    return {
        name: generateName(),
        docText: generateText(),
        date: generateDate(),
        dateUploaded: generateDate(),
        sessionNumber: generateNumber(),
        uploadedBy: generateName()
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

    describe('Transcription API resource', function () {
        it('should return status 200 on start', function () {
            return chai.request(app)                
                .get('/transcriptions')
                .auth('henry', 'johnson123')
                .send({
                    username: 'henry',
                    password: 'johnson123'    
                })
                .then(function (res) {
                    res.should.have.status(200);
                });
        });
    });

    describe('GET Resource', function () {
        it('should return all transcriptions in databse on GET', function () {
            return chai.request(app)
                .get('/transcriptions')
                .auth('henry', 'johnson123')
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.transcriptions.should.have.lenght.of.at.least(1);
                    return Transcriptions.count();
                })
                .then(count => {
                    res.body.transcriptions.should.have.length.of(count);
    
                })
                .catch(err => console.error(err));
        });

        it('should return transcriptions with the right fields', function () {
            return chai.request(app)
                .get('/transcriptions')
                .auth('henry', 'johnson123')
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
                    return Transcriptions.findById
                })
        });
    });

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
            return chai.request(app)
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
                .then(function (transcription)  {
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

    describe('POST endpoint to store new userrs at /users', () => {
        it('should register a new user', function() {
            return chai.request(app)
                .post('/users')
                .send({
                    username: 'buttface',
                    password: 'mcgee'
                })
                .then((res) => {                    
                    res.status.should.eql(201);
                });
        });
    });

    describe('POST endpoint to log users in at /users/login', () => {
        it('should login a user', function () {
            return chai.request(app)
                .post('/users/login')
                .auth('henry', 'johnson123')
                .then((res) => {
                    console.log(res.body);
                    res.should.be.json;

                });
        });
    });

});