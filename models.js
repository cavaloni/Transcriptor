const mongoose = require('mongoose');

const transcriptionSchema = mongoose.Schema ({ 
    name : {type: String, required: true},
    docText: {type: String, required: true},
    date: {type: Date, required: true},
    dateUploaded: {type: Date, required: true},
    sessionNumber: {type: String, required: true}
});

transcriptionSchema.methods.apiRepr = function () {
    return {
        id: this._id,
        name: this.name,
        docText: this.docText,
        date: this.date,
        dateUploaded: this.dateUploaded,
        sessionNumber: this.sessionNumber,
        uploadedBy: this.uploadedBy
    };
}

const Transcriptions = mongoose.model('Transcriptions', transcriptionSchema);

module.exports = {Transcriptions};