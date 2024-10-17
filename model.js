const mongoose = require('mongoose');

// Image schema
const imageSchema = new mongoose.Schema({
    name: String,
    age: Number,
    salary: Number,
    gender: String,
    profession: String,
    jadagam: String,
    img: {
        data: Buffer,
        contentType: String,
    }
});

// User schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    password: { type: String, required: true },
});

// Exporting models
const Image = mongoose.model('Image', imageSchema);
const User = mongoose.model('User', userSchema);

module.exports = { Image, User };
