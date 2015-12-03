// app/routes.js
var async       = require('async');
var crypto      = require('crypto');
var mongoose    = require('mongoose');
var User        = mongoose.model('User'); 
var nodemailer  = require('nodemailer');

module.exports = function(app, passport){

	//render index.html
	app.get('/', function(req, res){
		res.render('index.html', { 
            message: req.flash('loginMessage')
        });
	});

	// show the login form
    app.get('/login', function(req, res) {
        res.render('login.html', { message: req.flash('loginMessage') }); 
    });

    //process the login form
	app.post('/login', passport.authenticate('local-login', {
        successRedirect : '/app', // redirect to the secure app section
        failureRedirect : '/#?login', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));

	app.get('/signup', function(req, res) {
        res.render('signup.html', { message: req.flash('loginMessage') }); 
    });

    // process the signup form
    app.post('/signup', passport.authenticate('local-signup', {
        successRedirect : '/app', // redirect to the secure app section
        failureRedirect : '/signup', // redirect back to the signup page if there is an error
        failureFlash : true // allow flash messages
    }));


    app.get('/app', isLoggedIn, function(req, res) {
        res.render('app.html', {
            user : req.user,
            cool : "justin bieber" // get the user out of session and pass to template
        });
    });

    app.get('/logout', function(req, res) {
        req.logout();
        res.redirect('/');
    });

    //forgot password
    app.get('/forgot', function(req, res) {
      res.render('forgot.html', {
        user: req.user,
        message: req.flash('newPasswordMessage')
      });
    });

    //create a new password for the user
    app.post('/forgot', function(req, res, next) {
      async.waterfall([
        function(done) {
          crypto.randomBytes(20, function(err, buf) {
            var token = buf.toString('hex');
            done(err, token);
          });
        },
        function(token, done) {
          User.findOne({ email: req.body.email }, function(err, user) {
            if (!user) {
              req.flash('newPasswordMessage', 'No account with that email address exists.');
              return res.redirect('/forgot');
            }

            user.resetPasswordToken = token;
            user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

            user.save(function(err) {
              done(err, token, user);
            });
          });
        },
        function(token, user, done) {
          var smtpTransport = nodemailer.createTransport('SMTP', {
            service: 'Gmail',
            auth: {
              user: 'email',
              pass: 'password'
            }
          });
          var mailOptions = {
            to: user.email,
            from: 'email',
            subject: 'Airdate Password Reset',
            text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
              'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
              'http://' + req.headers.host + '/reset/' + token + '\n\n' +
              'If you did not request this, please ignore this email and your password will remain unchanged.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('newPasswordMessage', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
            done(err, 'done');
          });
        }
      ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
      });
    });

    //user clicked on reset password link in email
    app.get('/reset/:token', function(req, res) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('/forgot');
        }
        res.render('reset.html', {
          user: req.user,
          message: req.flash()
        });
      });
    });

    //new password gets sent to users email
    app.post('/reset/:token', function(req, res) {
      async.waterfall([
        function(done) {
          User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
            if (!user) {
              req.flash('error', 'Password reset token is invalid or has expired.');
              return res.redirect('back');
            }

            user.password = req.body.password;
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          });
        },
        function(user, done) {
          var smtpTransport = nodemailer.createTransport('SMTP', {
            service: 'Gmail',
            auth: {
              user: 'email',
              pass: 'password'
            }
          });
          var mailOptions = {
            to: user.email,
            from: 'email',
            subject: 'Your Airdate password has been changed',
            text: 'Hello,\n\n' +
              'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
          };
          smtpTransport.sendMail(mailOptions, function(err) {
            req.flash('success', 'Success! Your password has been changed.');
            done(err);
          });
        }
      ], function(err) {
        res.redirect('/');
      });
    });


};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
} 
