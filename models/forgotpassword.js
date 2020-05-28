const mongoose = require('mongoose');

let PassResetSchema = mongoose.Schema({
    user: {
        type: String,
        required: true
    },
    token: {
        type: String,
        required: true
    }
});

const PassReset = module.exports = mongoose.model('PassReset',PassResetSchema);