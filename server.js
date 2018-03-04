const webpush = require('web-push');
const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const app = express();


var mongodb = require("mongodb");
var ObjectID = mongodb.ObjectID;
var mongoUri = process.env.MONGOLAB_URI || 'mongodb://localhost/test';
var USERS_COLLECTION = "usersCollection";
// Create a database variable outside of the database connection callback to reuse the connection pool in your app.
var db;

// Express setup
app.use(express.static('public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));


// Home page
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

app.get('/unsubscribe', function (req, res) {
  res.sendFile(path.join(__dirname + '/unsubscribe.html'));
});


// Article page
app.get('/article', function (req, res) {
  res.sendFile(path.join(__dirname + '/article.html'));
});

// Article page
app.get('/contact', function (req, res) {
  res.sendFile(path.join(__dirname + '/contact.html'));
});

// Offline page
app.get('/offline', function (req, res) {
  res.sendFile(path.join(__dirname + '/offline-page.html'));
});

// Send a message
// app.post('/sendMessage', function (req, res) {
//   res.json(`Message sent to ${req.body.email}`);
// });




// Connect to the database before starting the application server. 
mongodb.MongoClient.connect(mongoUri, function (err, database) {
 if (err) {
 console.log(err);
 process.exit(1);
 }

 // Save database object from the callback for reuse.
 db = database;
 console.log("Database connection ready");
 var server_port = process.env.PORT || 3111;

 // The server
 app.listen(server_port, function () {
   console.log('App listening on port : ' + server_port)
 });
});



function saveRegistrationDetails(req) {
  // Save the users details in a DB
  var userDetails = req.body;
  userDetails.createDate = new Date();
    db.collection(USERS_COLLECTION).insertOne(userDetails, function(err, doc) {
      if (err) {
        console.log("Failed to create new user details " , err.message);
      } else {
        console.log("Saved to mongo collection" , doc.ops[0]);
      }
    });

}

webpush.setVapidDetails(
  'mailto:contact@deanhume.com',
  'BAyb_WgaR0L0pODaR7wWkxJi__tWbM1MPBymyRDFEGjtDCWeRYS9EF7yGoCHLdHJi6hikYdg4MuYaK0XoD0qnoY',
  'p6YVD7t8HkABoez1CvVJ5bl7BnEdKUu5bSyVjyxMBh0'
);

// Home page
app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname + '/index.html'));
});

// Article page
app.get('/article', function (req, res) {
  res.sendFile(path.join(__dirname + '/article.html'));
});

// Send a message
app.post('/sendMessage', function (req, res) {

  var endpoint = req.body.endpoint;
  var authSecret = req.body.authSecret;
  var key = req.body.key;

  const pushSubscription = {
    endpoint: req.body.endpoint,
    keys: {
      auth: authSecret,
      p256dh: key
    }
  };

  var body = 'Breaking News: Nose picking ban for Manila police';
  var iconUrl = 'https://raw.githubusercontent.com/deanhume/progressive-web-apps-book/master/chapter-6/push-notifications/public/images/homescreen.png';

  webpush.sendNotification(pushSubscription,
    JSON.stringify({
      msg: body,
      url: '/article?id=1',
      icon: iconUrl,
      type: 'actionMessage'
    }))
    .then(result => {
      console.log(result);
      res.sendStatus(201);
    })
    .catch(err => {
      console.log(err);
    });
});

// Register the user
app.post('/register', function (req, res) {

  var endpoint = req.body.endpoint;
  var authSecret = req.body.authSecret;
  var key = req.body.key;

  // Store the users registration details
  saveRegistrationDetails(req);

  const pushSubscription = {
    endpoint: req.body.endpoint,
    keys: {
      auth: authSecret,
      p256dh: key
    }
  };

  var body = 'Thank you for registering';
  var iconUrl = '/images/icon-60.png';

  webpush.sendNotification(pushSubscription,
    JSON.stringify({
      msg: body,
      url: '/',
      icon: iconUrl,
      type: 'register'
    }))
    .then(result => {
      console.log(result);
      res.sendStatus(201);
    })
    .catch(err => {
      console.log(err);
    });

});


// Generic error handler used by all endpoints.
function handleError(res, reason, message, code) {
  console.log("ERROR: " + reason);
  res.status(code || 500).json({"error": message});
 }