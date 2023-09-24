//jshint esversion:6
require('dotenv').config();
const express=require('express');
var jsdom = require('jsdom');
const $ = require('jquery')(new jsdom.JSDOM().window);
const mongoose=require('mongoose');
const passport=require('passport');
const session=require('express-session');
const passportLocalMongoose=require('passport-local-mongoose');
var findOrCreate = require('mongoose-findorcreate');
var GoogleStrategy = require('passport-google-oauth20').Strategy;
mongoose.set('strictQuery', true);


var encrypt = require('mongoose-encryption');
const bodyParser=require('body-parser');
const ejs=require('ejs');
const { ObjectId } = require('mongodb');

const app=express();

app.set('view engine', 'ejs');

app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));
mongoose.connect('mongodb+srv://yogendrapawar:yogendra@cluster0.vrkxemf.mongodb.net/?retryWrites=true&w=majority', {
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
  secret: {
    type: [{
      usersecret: String,
      newPostTime: String,
      newPostDateAndDay: String
    }],
    default: []
  }
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
    callbackURL: "https://secrets-website.vercel.app/auth/google/secrets",
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

  // Define a route to handle DELETE requests
app.delete('/delete', (req, res) => {
  const itemIdToDelete = req.body.id; // Get the ID from the request body
  console.log(itemIdToDelete);
  // Use Mongoose to find and delete the item from the database
  
});


  app.route("/mydata")
  .get((req,res)=>{
      if(req.isAuthenticated()){
        user.findById(req.user.id,function(err,found){
          if(err){
            console.log(err);
          }else{
            if (found.secret.length > 0) {
              res.render('mydata', { secrets: found.secret });
            } else {
              // Handle the case where 'found' or 'found.secret' is empty
              res.render('mydata', { secrets: []}); // You can pass an empty array or handle it as needed
            }
          }

        });
        // res.render('mydata',{mysecrets:})
      }else{
        res.redirect('login');
      }
  })
  

  // let port=process.env.PORT;
  // if(port===null||port===""){
  //   port=3000;
  // }
  // app.listen(port);
///delete
app.route("/delete/:id")
.get ((req, res, next)=>{
  const secretIdToDelete = req.params.id; 
  console.log(secretIdToDelete);
  // Assuming you have the ID of the `userSecret` you want to delete


// Use Mongoose to find the user and remove the secret by its _id
user.findByIdAndUpdate(
  req.user.id, 
  { $pull: { secret: { _id: secretIdToDelete } } },
  (err, updatedUser) => {
    if (err) {
      console.error(err);
    } else {
      if (updatedUser) {      
        console.log(`userSecret with ID ${secretIdToDelete} has been deleted.`);
        res.redirect('/mydata')
      } else {
        console.log('User or userSecret not found.');
      }
    }
  }
);

});

app.post('/editsecret/:id', (req, res) => {
  const secretId = req.params.id;
  const editedSecret = req.body.editsecret;

  // Now you can access the data submitted through the form
  console.log(`Secret ID: ${secretId}`);
  console.log(`Edited Secret: ${editedSecret}`);


  // Perform any necessary actions with the data (e.g., update a database)
  // ...
  user.findOneAndUpdate(
    {"secret._id":secretId},
    { "$set": { "secret.$.usersecret": editedSecret }},
    { new: true },  (err, result)=>{
      if(err){
        console.log("Error updating secret");
      }else{
        if(result){
          console.log("Updated post");
          res.redirect('/mydata');
        }else{
          console.log("No user found");
        }
      }
    }
  );
  
});
app.get("/edit/:id",(req, res)=>{
  const secretId=req.params.id;
  user.findOne({ 'secret': { $elemMatch: { _id: secretId } } }, (err, user) => {
    if (err) {
      console.error(err);
      // Handle the error
    } else {
      if (user) {
        // The 'user' variable contains the user document with the specific secret
        const specificSecret = user.secret[0]; // Since $elemMatch returns an array with a single element
        
        res.render('editsecret', {secret:specificSecret});
        // Do something with the specific secret
      } else {
        // User not found
        console.log('User not found');
      }
    }
  });


  
  
});


const PORT = 3000
  app.listen(PORT, function() {
    console.log("Server started on port 3000");
  });
///////////////listen//////////////////////
