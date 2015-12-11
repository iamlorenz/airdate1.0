module.exports = function(app, passport){
  //load controllers
  var users = require('./controllers/users_controller.js');
  var shows = require('./controllers/shows_controller.js');

	//render index.html
	app.get('/', function(req, res){
		res.render('index.html', { 
            message: req.flash('loginMessage')
        });
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
    failureRedirect : '/#?signup', // redirect back to the signup page if there is an error
    failureFlash : true // allow flash messages
  }));

  app.get('/app', isLoggedIn, function(req, res) {
      res.render('app.html', {
        user : req.user,
        message: req.flash('loginMessage')
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

  app.post('/forgot', users.forgotPassword);
  app.get('/reset/:token', users.renderResetPassword);
  app.post('/reset/:token', users.resetPassword);
  app.post('/addShow', shows.addShow);
  app.get('/api/shows', shows.showsApi);
  app.post('/rmShow', shows.rmShow);

};

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on 
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.redirect('/');
} 