//jshint esversion:6
require('dotenv').config() //keep it at top always
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
// const encrypt = require ("mongoose-encryption");
// const md5 = require('md5');

// const bcrypt = require('bcrypt');
// const saltRounds = 10;

const session = require('express-session');
const passportLocalMongoose= require('passport-local-mongoose');
const passport = require('passport');

const app = express(); //initialize new express app
//access env. variables
// console.log(process.env.API_KEY);

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

app.use(session({
    secret: 'Our Little Secret.',
    resave: false,
    saveUninitialized: false
    // cookie: { secure: true }
}));

app.use(passport.initialize());
app.use(passport.session());


mongoose.connect("mongodb://localhost:27017/userDB",{useNewUrlParser: true});
// mongoose.set("useCreateIndex", true);

const userSchema = new mongoose.Schema({
    email : String,
    password : String,
    secret: String
});

userSchema.plugin(passportLocalMongoose);

const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get('/', function(req, res){
    res.render("Home");
});

app.get('/login', function(req, res){
    res.render("Login");
});

app.get('/register', function(req, res){
    res.render("Register");
});

app.get('/secrets', function(req, res){
    // if(req.isAuthenticated()){
    //     res.render("secrets");
    // }else{
    //     res.redirect("/login");
    // }
    User.find({"secret":{$ne: null}}).then((foundUsers)=>{
        if(foundUsers){
              res.render("secrets", {usersWithSecrets: foundUsers});
        }
    }).catch(err => console.log("Error Occured"))
});

app.get('/submit', function(req, res){
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
});
app.post("/submit", function(req,res){
    const submittedSecret = req.body.secret;
    User.findById(req.user.id).then((foundUser)=>{
        if(foundUser){
            foundUser.secret=submittedSecret;
            foundUser.save()
             .then(user => res.redirect("/secrets"))
             .catch(err => handleError(err))
        }
    }).catch(err => console.log("Error Occured"))
});

app.get("/logout",function(req, res, next){
    req.logout(function(err) {
      if (err) { return next(err); }
      res.redirect('/');
    })
});



app.post('/register', function(req,res){
User.register({username: req.body.username}, req.body.password)
    .then((user)=>{
       if(user) {
          passport.authenticate("local")(req,res,function(){
              res.redirect("/secrets");
          })
       }else{
           console.log("Error occured");
           res.redirect("/register");
       }
    }).catch(err => console.log("Error Occured"))
});

app.post('/login', function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user , function(err){
        if(err){
            console.log(err);
        }else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    })
});




app.listen(3000, function () {
    console.log("Server is running on port 3000..");
});





// app.post('/register' , function(req,res){
//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {

//         const newUser = new User({
//             email : req.body.username,
//             // password : req.body.password
//             // password : md5(req.body.password) //using hash function
//             password: hash
//         });

//         newUser.save()
//         .then(user => res.render("secrets"))
//         .catch(err => handleError(err))
//     });
// });

// app.post('/login', function(req,res){
//     const userName = req.body.username;
//     // const password = md5(req.body.password);
//     const password = req.body.password;

// User.findOne({email : userName})
//     .then((foundUser)=>{
//         if(foundUser){
//             bcrypt.compare(password, foundUser.password).then((result)=> {
//                 if(result){
//                     res.render("secrets");
//                 }
//             }).catch((error) => {
//                 console.log(error)
//             })
//         }
//     })
//     // .catch(err => handleError(err))
//     .catch(err => console.log("Error Occured"))
// });