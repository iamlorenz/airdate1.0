//load some stuff
var async       = require('async');
var crypto      = require('crypto');
var bcrypt      = require('bcrypt-nodejs');
var mongoose    = require('mongoose');
var User        = mongoose.model('User');
var nodemailer  = require('nodemailer');
var emailConfig = require('../../config/email_config');

//helper functions
//encrypt the password after a password reset
function generateHash(password) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8), null);
};

//delete User Account
exports.deleteUser = function(req,res){
  User.findOne({_id: req.session.passport.user})
  .exec(function(err, user){

    if (user){

      user.remove(function(){
        req.logout(function(){
          res.redirect('/');
        });
      });

    } else {
      console.log("User not found!");
    }

  });
};

//give the user the chance to set a new password ============================
exports.forgotPassword = function(req,res, next){
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
            user: emailConfig.email,
            pass: emailConfig.password
          }
        });
        var mailOptions = {
          to: user.email,
          from: emailConfig.email,
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
};

//user clicked on reset password link in email
exports.renderResetPassword = function(req,res){
	User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
	  if (!user) {
	    req.flash('resetPasswordMessage', 'Password reset token is invalid or has expired.');
	    return res.redirect('/forgot');
	  }
	  res.render('reset.html', {
	    user: req.user,
	    message: req.flash('resetPasswordMessage')
	  });
	});
};


//user sets new password ====================================
exports.resetPassword = function(req,res, next){
    async.waterfall([
      function(done) {
        User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
          if (!user) {
            req.flash('resetPasswordMessage', 'Password reset token is invalid or has expired.');
            return res.redirect('back');
          }

          user.password = generateHash(req.body.password);
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
            user: emailConfig.email,
            pass: emailConfig.password
          }
        });
        var mailOptions = {
          to: user.email,
          from: emailConfig.email,
          subject: 'Your Airdate password has been changed',
          text: 'Hello,\n\n' +
            'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('loginMessage', 'Success! Your password has been changed.');
          done(err);
        });
      }
    ], function(err) {
      res.redirect('/app');
    });
};
