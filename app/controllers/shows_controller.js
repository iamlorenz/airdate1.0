var mongoose    = require('mongoose');
var User        = mongoose.model('User');

//add a show to MongoDB
exports.addShow = function(req, res){
  User.update({_id: req.session.passport.user},
    {
      $addToSet : {
        shows: {

          "name"    : req.body.show.name,
          "id"      : req.body.show.id,
          "started" : req.body.show.started

        }
      }
    },(function(err){
      if (err)
        res.send(err);
      //else console.log
      console.log(req.session.passport.user + ' just added ' + req.body.show.name + ' to his db.');
  }));
};

//remove a show from the DB
exports.rmShow = function(req, res){
  User.update({_id: req.session.passport.user},
    {
      $pull : {
        shows: {

          id: req.body.showId

        }
      }
    },(function(err){
      if (err)
        res.send(err);
      //else console.log
      console.log(req.session.passport.user + ' just deleted ' + req.body.showId + ' from his db.');
  }));
};

//send user shows to frontend
exports.showsApi = function(req, res) {

  if(req.session.passport.user){
    User.findOne({_id: req.session.passport.user},(function(err, data) {
        if (err)
            res.send(err);
        res.json(data.shows);
    }));
  } else {
    console.log('Not logged in yet.');
  }
};
