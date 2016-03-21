// get all the tools we need
var express  = require('express');
var app      = express();
var port     = process.env.PORT || 8080;
var passport = require('passport');
var mongoose = require('mongoose');

var async		 = require('async');
var nodemailer	 = require('nodemailer');
var crypto		 = require('crypto');
var flash		 = require('connect-flash');
var morgan       = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser   = require('body-parser');
var browserSync  = require('browser-sync');
var session		 = require('express-session');

// DB configuration ===============================================================
// connect to our database. later use /config/database.js for this
var db = mongoose.connect(process.env.MONGOLAB_URI, function (error) {
    if (error) console.error(error);
    else console.log('mongo connected');
});

require('./config/passport')(passport); // pass passport for configuration

// set up our express application
app.use('/static', express.static( './static'));
app.use(morgan('dev')); // log every request to the console
app.use(cookieParser()); // read cookies (needed for auth)
app.use(bodyParser()); // get information from html forms

app.engine('.html', require('ejs').__express); // sets the HTML templating to EJS
app.set('views', __dirname + '/views'); //sets the views directory to the apps views
app.set('view engine', 'html');


//passport requirements
app.use(session({ secret: 'verygoodsecret' })); // session secret
app.use(passport.initialize());
app.use(passport.session()); // persistent login sessions
app.use(flash()); // use connect-flash for flash messages stored in session

// routes ======================================================================
require('./app/routes.js')(app, passport); // load our routes and pass in our app

// launch ======================================================================
app.listen(port, listening);

//browser sync
function listening () {
  browserSync({
  	browser: "google chrome",
  	notify: false,
    proxy: 'localhost:' + port,
    files: ['static/**/*.{js,css}']
  });
  console.log('\n'+'========= The magic happens on port ' + port + ' =========' + '\n');
}



