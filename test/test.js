const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');

const should = chai.should();


chai.use(chaiHttp);

describe ('Transcription API resource', function () {

  beforeEach(function() {
  server = require('../server');
});

afterEach(function() {
  server.close();
});


    it('should return status 200 on start', function () {
        return chai.request(server)
            .get('/')
            .then(function (res) {
                res.should.have.status(200)            
            });
            done();
    });

});


