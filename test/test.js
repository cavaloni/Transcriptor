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


