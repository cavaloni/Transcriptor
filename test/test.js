const chai = require('chai');
const chaiHttp = require('chai-http');
const should = chai.should();
const expect = chai.expect;
const mongoose = require('mongoose');
const faker = require('faker');
const bcrypt = require('bcryptjs');
const tester = require('supertest-as-promised').agent;
const superagent = require('superagent');
const agent = superagent.agent();
const {app, runServer, closeServer} = require('../server');
const {Transcriptions} = require('../transcriptions/trans-models');
const {User} = require('../users/index.js');

chai.use(chaiHttp);

//generators for random document insertions

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
    let user = {
            username: 'henry',
            password: hash,
            project: 'wierd'
        };      
    return User.create(user);
}

function generateTranscriptionData () {
    return {
        projectName: generateName(),
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

function generateControlTranscriptionData() {  
    return {
        projectName: 'wierd',
        name: 'bear',
        docText: 'some great text that contains normal words that can be searched',
        date: generateDate(),
        sessionNumber: generateNumber(),
        dateUploaded: generateDate(),
        filepath: {
            path: '/bung',
            originalname: 'hole'
        },
        uploadedBy: 'henry'
    }
}

function seedTransData() {
    console.log('seeding transcription data');
    const seedData = [];                                    // need a predictable piece of data for certain search tests
    let controlData = generateControlTranscriptionData();   

    for (let i = 0; i <= 10; i++) {
        seedData[i] = generateTranscriptionData();
    }
    seedData.push(controlData);
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

    let cookie; // need a cookie to be passed between each test so that
                // Authentication passes on protected endpoints
    before(function () {
        return runServer();
    });

    beforeEach(function () {
        return seedUser();
    })

    beforeEach(function () {
        return seedTransData();
    });

    afterEach(function () {
        return tearDownDB();
    });

    beforeEach(function () {
        return tester(app)
            .post('/users/login')
            .send({
                username: 'henry',
                password: 'johnson123',
            })
            .auth('henry', 'johnson123')
            .expect(200)
            .expect('Content-Type', /json/)
            .then(function (res) {
                cookie = res.headers['set-cookie'];
            });
    });

    after(function () {
        return closeServer();
    });

    describe('GET resource for searching', function () {
        it('should return a search query', function () {
            Transcriptions.on('index', function (err) {
                if (err) {
                    console.error('User index error: %s', err);
                } else {
                    console.info('User indexing complete');
                }
            });
            const query = 'great';
            return tester(app)
                .post('/transcriptions/search')
                .set('cookie', cookie)
                .send({
                    search: query
                })
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.be.a('array');
                    res.body.forEach((searchResult) => {
                        searchResult.should.include.keys('name', 'uploadedBy', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                    });
                })
        })
    })

    describe('GET Resource', function () {
        it('should get all transcriptions', function () {
            let response;
            return tester(app)
                .get('/transcriptions')
                .set('cookie', cookie)
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.should.have.length.of.at.least(1);
                    response = res;
                    return Transcriptions.count();
                })
                .then(count => {
                    response.body.should.have.length.of(count);
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
                    resTranscription = res.body[0].id;
                    trans = res.body[0];
                    return Transcriptions.findById(resTranscription)
                        .then(function (item) {
                            item.id.should.equal(trans.id);
                            item.name.should.equal(trans.name);
                            item.sessionNumber.should.equal(trans.sessionNumber);
                        });
                });
        });
    });

    describe('GET resource for individual user', function () {
        it('should get transcriptions that the user uploaded', function () {
            let resTranscription;
            return tester(app)
                .get('/transcriptions/henry')
                .set('cookie', cookie)
                .then(function (res) {
                    res.should.have.status(200);
                    res.should.be.json;
                    res.body.transcriptions.should.be.a('array');
                    res.body.transcriptions.should.have.length.of.at.least(1);
                    res.body.transcriptions.forEach(function (transcription) {
                        transcription.should.be.a('object');
                        transcription.should.include.keys('id', 'name', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                    });
                    resTranscription = res.body.transcriptions[0].id;
                    trans = res.body.transcriptions[0];
                    return Transcriptions.findById(resTranscription)
                        .then(function (item) {
                            item.id.should.equal(trans.id);
                            item.name.should.equal(trans.name);
                            item.sessionNumber.should.equal(trans.sessionNumber);
                        });
                });
        })
    })

    describe('POST resource for transcriptions', function () {
        it('Should insert a transciption in the databse on POST', function () {
            newTranscription = {
                projectName: 'wierd',
                name: 'John Doe',
                date: '12/12/12',
                sessionNumber: '2',
                uploadedBy: 'henry'
            }
            return tester(app)
                .post('/transcriptions/upload/henry')
                .set('cookie', cookie)
                .field('projectName', 'wierd')
                .field('name', 'John Doe')
                .field('date', '12/12/12')
                .field('sessionNumber', 2)

                .attach('file', './uploads/test.txt')
                .then(function (res) {
                    res.should.have.status(201);
                    res.should.be.json;
                    res.body.should.be.a('object');
                    res.body.should.include.keys('name', 'uploadedBy', 'docText', 'date', 'dateUploaded', 'sessionNumber', 'project', 'id');
                    res.body.name.should.equal(newTranscription.name);
                    res.body.uploadedBy.should.equal(newTranscription.uploadedBy);
                    res.body.sessionNumber.toString().should.equal(newTranscription.sessionNumber);
                    return Transcriptions.findById(res.body.id)
                        .exec();
                })
                .then(function (transcription) {
                    console.log(transcription);
                    transcription.name.should.equal(newTranscription.name);
                    transcription.uploadedBy.should.equal(newTranscription.uploadedBy);
                    transcription.sessionNumber.toString().should.equal(newTranscription.sessionNumber);
                });
        });
    });

    describe('POST resource for updating transcriptions', function () {
        it('Should update transcriptions on POST', function () {
            let update = {
                name: faker.name,
                sessionNumber: faker.random,
                docText: faker.Lorem,
            };
            Transcriptions
                .findOne()
                .then(function (trans) {
                    update = trans.id

                    return tester(app)
                        .post(`/transcriptions/${trans.id}`)
                        .set('cookie', cookie)
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

    describe('GET resource for transcription download', function () {
        it('Should download a document on GET', function () {
            let newTranscription = {
                projectName: 'wierd',
                name: 'John Doe',
                date: '12/12/12',
                sessionNumber: '2',
                uploadedBy: 'henry'
            }
            return tester(app)
                .post('/transcriptions/upload/henry')
                .set('cookie', cookie)
                .field('projectName', 'wierd')
                .field('name', 'John Doe')
                .field('date', '12/12/12')
                .field('sessionNumber', 2)
                .attach('file', './uploads/test.txt')
                .then((res1) => {
                    return tester(app)
                        .get(`/transcriptions/download/${res1.body.name}`)
                        .set('cookie', cookie)
                        .send({
                            project: `${res1.body.project}`
                        })
                        .then((res) => {
                            res.should.have.status(200);
                        })
                });
        });
    });

    describe('DELETE resource for transcriptions', function () {
        it('Should remove transcriptions on DELETE', function () {
            let transcriptionTD;
            return Transcriptions
                .findOne()
                .then(function (transcription) {
                    transcriptionTD = transcription;
                    return tester(app).delete(`/transcriptions/${transcriptionTD.id}`);
                })
                .then(function (res) {
                    res.should.have.status(204);
                    return Transcriptions.findById(transcriptionTD.id);
                })
                .then(function (transciption) {
                    should.not.exist(transciption)
                });
        });
    });

});