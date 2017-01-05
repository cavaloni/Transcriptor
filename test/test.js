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

// mongoose.set('debug', true);

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
            password: hash,
            project: "wierd"
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
    const seedData = [];
    //ned a predictable piece of data for certain search tests
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

let cookie;

    before(function () {
        return runServer();
    });

    beforeEach(function () {
        return seedUser();
    })

    beforeEach(function () {
        return seedTransData();
    });

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
          password: 'johnson123',
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
                .send({search: query})
                .then(function (res) {  
                    console.log('------------------123456780--------------------------');
                    console.log(res);
                    console.log(res.body);
                    console.log(res.body[0] + 'this one');
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

    it('should get all transcriptions', function () {  
        let response;
        return tester(app)
                    .get('/transcriptions')
                    .set('cookie', cookie)
                    .then(function (res) {
                        console.log(res.body);
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
                    console.log('**************made it here');
                    res.body.transcriptions.forEach(function (transcription) {
                        transcription.should.be.a('object');
                        transcription.should.include.keys('id', 'name', 'docText', 'date', 'dateUploaded', 'sessionNumber');
                    });
                    console.log(res.body);
                    resTranscription = res.body.transcriptions[0].id;
                    trans = res.body.transcriptions[0];
                    return Transcriptions.findById(resTranscription)
                    .then(function (item) {
                            console.log('**************and here');
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
                projectName: "wierd",
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

                .attach('file', './uploads/8859-1.txt')
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
                    transcription.name.should.equal(newTranscription.name);
                    transcription.uploadedBy.should.equal(newTranscription.uploadedBy);
                    transcription.sessionNumber.toString().should.equal(newTranscription.sessionNumber);
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