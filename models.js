const mongoose = require('mongoose');



const transcriptionSchema = mongoose.Schema ({ 
    projectName: {type: String, required: true},
    name : {type: String, required: true},
    docText: {type: String, text: true, required: true},
    date: {type: Date, required: true},
    dateUploaded: {type: Date, required: true},
    sessionNumber: {type: Number, required: true},
    uploadedBy: {type: String, required: true},
    filepath: { 
        path:{
        type: String,
        required: true,
        trim: true
        },
        originalname: 
        {
        type: String,
        required: true
        }
    }
});

transcriptionSchema.methods.apiRepr = function () {
    return {
        project: this.projectName,
        id: this._id,
        name: this.name,
        docText: this.docText,
        date: this.date,
        dateUploaded: this.dateUploaded,
        sessionNumber: this.sessionNumber,
        uploadedBy: this.uploadedBy
    };
}

transcriptionSchema.index({docText: 'text'});

const Transcriptions = mongoose.model('transcriptions', transcriptionSchema);

module.exports = {Transcriptions};

