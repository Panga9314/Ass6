const mongoose = require("mongoose");
const bcrypt = require('bcryptjs');
const Users = require("./models/usermodel");
module.exports.initialize = function () {
    return new Promise(function (resolve, reject) {
        let db = mongoose.connect("mongodb+srv://rsingh651:huslYu1Z5hWoZbz4@cluster0.lurxndm.mongodb.net/?retryWrites=true&w=majority", { useNewUrlParser: true, useUnifiedTopology: true })
            .then(response => console.log("Connected"))
            .catch(error => console.log(error));
    });
};

module.exports.registerUser = function (userData) {


    return new Promise(function (resolve, reject) {




        if (userData.password != userData.password1) {
            reject("Password do not match");
        }

        bcrypt.hash(userData.password, 10).then(hash => { // Hash the password using a Salt that was generated using 10 rounds
            userData.password = hash;
            userData.loginHistory = [];
            let newUser = new Users(userData);
            newUser.save().then(() => {
                resolve("");
            })
                .catch(err => {
                    if (err.code == 11000)
                        reject("User Name already taken");
                    else
                        reject("There was an error creating the user: " + err);
                })

        })
            .catch(err => {
                console.log(err); // Show any errors that occurred during the process
            });



    });
}

module.exports.checkUser = function (userData) {
    return new Promise(function (resolve, reject) {
        Users.find({ userName: userData.userName }).exec().then(users => {
            if (users.length == 0)
                reject("Unable to find user:" + userData.userName);
            else {
                bcrypt.compare(userData.password, users[0].password).then((result) => {
                    // result === true if it matches and result === false if it does not match
                    if (result == false) {

                        reject("Incorrect Password for user: " + userData.userName);
                    }
                    else {
                        users[0].loginHistory.push({ dateTime: (new Date()).toString(), userAgent: userData.userAgent })
                        Users.updateOne({ userName: userData.userName }, { $set: { loginHistory: users[0].loginHistory } })
                            .exec()
                            .then(() => resolve(users[0]))
                            .catch((err) => { reject("There was an error verifying the user: " + err) })

                    }

                });


            }

        }).catch(err => {
            reject("Unable to find userss: " + err);
        });
    });
}