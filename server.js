const express = require('express');
const bodyParser = require('body-parser');
const validator = require("validator");
const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/iCrowdTask", {useNewUrlParser:true});
const Requester = require("./models/Requester");
const bcrypt = require('bcrypt-nodejs');

const app = express();

app.use(bodyParser.urlencoded({extended:true}))
app.use(express.static(__dirname + '/public'));

app.get('/', (req,res)=>{
    res.redirect('/reqregister');
});

app.get('/reqlogin', (req,res)=>{
    res.sendFile(__dirname + "/public/reqlogin.html");
});

app.get('/reqregister', (req,res)=>{
    res.sendFile(__dirname + "/public/reqregister.html");
});

app.post('/reqregister', (req,res)=>{
    //console.log("POSTED "+req.body.country);
    let error = false;
    let hashPass = null;

    // ensure passwords match
    let password = req.body.password;
    if(password != req.body.passwordRepeat){
        password = "";
        error = true;
        console.log('Passwords dont match!');
    }
    
    // ensure country is not default option
    let country = req.body.country;
    if(country === "Country of residence *"){
        country = "";
        error = true;
        console.log('Country of residence not entered!');
    }

    if(!error){ // if above is okay process form
        bcrypt.genSalt(10, function (err, salt) {
            if (!err) {
                bcrypt.hash(password, salt, null, function (err, hash) {
                    if (!err) {
                        hashPass = hash;
                        const requester = new Requester(
                            {
                                country : country,
                                fName : req.body.fName,
                                lName : req.body.lName,
                                email : req.body.email,
                                password : hashPass,
                                address : req.body.address,
                                city : req.body.city,
                                state : req.body.state,
                                postCode : req.body.postCode,
                                mobileNumber : req.body.mobileNumber,
                            }
                        )
                    
                        requester.save((err) =>{ 
                            if (err){
                                console.log(err);
                                res.sendFile(__dirname + "/public/error.html");   
                            }
                            else{
                                console.log("Success!");
                                res.redirect('/reqlogin');
                            }
                        });
                    }
                    else
                        console.log(err);
                });
            }
            else console.log(err);
        });
    }
    else
        res.sendFile(__dirname + "/public/error.html");
});

app.post('/login', (req,res)=>{
    // handle verification of credentials

    let email = req.body.email;
    let password = req.body.password;

    Requester.findOne({ 'email': email }, 'password', function (err, requester) {
        if (err) return handleError(err);
        if(requester){ // result found for email
            bcrypt.compare(password, requester.password, (err, compResult) => {
                if(compResult) // passwords match
                    res.sendFile(__dirname + "/public/reqtask.html");
                else{ //passwords don't match
                    console.log("Passwords don't match.");
                    res.redirect('/reqlogin');
                }
            });
        }
        else{ // no user in db has provided email.
            console.log("No matching email in database.");
            res.redirect('/reqlogin');
        }
    });
});

app.listen(8080, function (request, response){
    console.log("Server is running on 8080");
});