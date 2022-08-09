//jshint esversion:6
require('dotenv').config();
const express=require('express');
const bcrypt = require('bcrypt');
const mongoose=require('mongoose');
const passport=require('passport');
const session=require('express-session');
const passportLocalMongoose=require('passport-local-mongoose');
var findOrCreate = require('mongoose-findorcreate');
var GoogleStrategy = require('passport-google-oauth20').Strategy;



var encrypt = require('mongoose-encryption');
const bodyParser=require('body-parser');
const ejs=require('ejs');

const app=express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect('mongodb+srv://yogendrapawar:Kepma%40Guitar@cluster0.vrkxemf.mongodb.net/userDB', {
  useNewUrlParser: true
});
// mongoose.set("useCreateIndex",true);

app.use(session({
  secret:'This is for Cookies.',
  resave:false,
  saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

///////////UserSchema////////////

const userSchema= new mongoose.Schema({
  email:String,
  password:String,
  googleId:String,
  secret:[{
    usersecret:String,
    newPostTime:String,
    newPostDateAndDay:String
  }]
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
//////////Encryption/////////////////

const user= new mongoose.model('user',userSchema);
passport.use(user.createStrategy());

passport.serializeUser(function(user, done) {
  done(null, user.id);
});

passport.deserializeUser(function(id, done) {
  user.findById(id, function(err, user) {
    done(err, user);
  });
});

///////////////PASSPORT GOOGLE AUTHENTICATION//////////
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    user.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

///////////////get home route///////////////////
app.route('/')
.get((req,res)=>{
  res.render('home');
});

//////////////login///////////////////
app.route('/login')
.get((req,res)=>{
  res.render('login');
})
.post((req,res)=>{

const newUser=new user({
  username: req.body.username,
  password: req.body.password
});
req.login(newUser,function(err){
  if(err){
    res.send(err);
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect('/secrets');
    });
  }
});
});

/////////////register/////////////////
app.route('/register')
.get((req,res)=>{
  res.render('register');
})
.post((req,res)=>{

user.register({username:req.body.username},req.body.password,(err,user)=>{
  if(err){
    res.send("User exists");
  }else{
    passport.authenticate("local")(req,res,function(){
      res.redirect('/secrets');
    });
  }

});
});

/////////////secrets/////////////////
app.route('/secrets')
.get((req,res)=>{
  user.find({secret:{$ne:null}},function(err,found){
    if(err){
      console.log(err);
    }else{
      if(found){
        res.render('secrets',{userSecret:found});
      }
    }
  });
});
/////////////"/logout"////////////
app.route('/logout')
.get((req,res)=>{
  req.logout(function(err){
    if(err){
      res.send(err);
    }else{
      res.redirect("/");
    }
  });

});

/////////////register/////////////////
app.route('/submit')
.post((req,res)=>{

  user.findById(req.user.id,function(err,found){

  var options = { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata'  };
  var today = new Date();
  const days=["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const postTime =
    today.toLocaleString('en-IN', { hour: 'numeric', minute: 'numeric', hour12: true, timeZone: 'Asia/Kolkata' });
  const dayAndDate=today.toLocaleDateString("en-US", options);

    var newSecret={
      usersecret:req.body.secret,
      newPostTime:postTime,
      newPostDateAndDay:dayAndDate

    };
    console.log(newSecret);
    if(err){
      console.log(err);
    }else{
      if(found){
        console.log(found);
        found.secret.push(newSecret);
        found.save(function(){
          res.redirect('/secrets');
        });
        // found.secret.push=req.body.secret;
        // found.secret.save(function(){
        //   res.redirect('/secrets');
        // });
      }
    }
  });
});

/////////google auth route///////////
app.get('/auth/google',passport.authenticate('google',{scope:['profile','email' ]}));
app.get('/auth/google/secrets',
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('/secrets');
  });
  ///////////////submit////////////////////
  app.get('/submit',function(req,res){
    if(req.isAuthenticated()){
      res.render('submit');
    }else{
      res.render('login');
    }
  });

  let port=process.env.PORT;
  if(port===null||port===""){
    port=3000;
  }
  app.listen(port);


  app.listen(3000, function() {
    console.log("Server started on port 3000");
  });
///////////////listen//////////////////////
