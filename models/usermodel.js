const mongoose = require("mongoose");

const Users = mongoose.model(
    "Users",
    new mongoose.Schema({
        userName: {type:String, unique: true },
        password:String,
        email:String,
        loginHistory:[{
            dateTime:Date,
            userAgent:String
        }]
    })
);

module.exports = Users;
