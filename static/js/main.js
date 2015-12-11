//core.js
app = angular.module('airdate',[])
	.controller('mainController', ['$scope', '$http','$location', function($scope, $http, $location){

		// variables
		$scope.searchResults = [];
		$scope.userShows = [];
		$scope.searching = false;
		$scope.selectedSeason = -1;
		$scope.toggle = false;
		$scope.showLogin = false;
		$scope.showSignup = false;
		$scope.popupText = "";

		if($scope.showLogin){
			$scope.showSignup = false;
		} else if ($scope.showSignup){
			$scope.showLogin = false;
		}

		//show login pop up
		if ($location.search()['login'])
			$scope.showLogin = true;
		else if ($location.search()['signup'])
			$scope.showSignup = true;


		//set $scope.userShows to the users shows whe he loggs in
		$http.get('/api/shows')
		.success(function(data){

			for (var i = 0; i < data.length; i++) {
				var userShow = data[i];
				userShow.upcomingEpisodes = [];
				userShow.pastEpisodes = [];
				userShow.seasons = [];
				//get the episodes
				getEpisodes(userShow);
				//add the selected show to the userShows array
				$scope.userShows.push(userShow);
			};

			console.log($scope.userShows);

		}).error(function(error){
			console.log(error);
		});

		//search the tvmaze db for the right show
		$scope.search = function() {

			$scope.searching = true;

			$http.get('http://api.tvmaze.com/search/shows?q=' + $scope.searchTerm)
			.success(function(data){
				$scope.searching = false;
				$scope.searchResults = data;

			}).error(function(error){
				$scope.searching = false;
			});
		};

		//select a show you want to add to your list
		$scope.select = function(name, id, date) {
	
			$scope.searching = true;
			$scope.searchTerm = "";

			var userShow = {};
			userShow.upcomingEpisodes = [];
			userShow.pastEpisodes = [];
			userShow.seasons = [];

			userShow.name = name;
			userShow.id = id;
			userShow.started = date.substring(0,4);
			//retrieve upcoming episodes for selected show
			getEpisodes(userShow);
			//add the selected show to the userShows array
			$scope.userShows.push(userShow);

			//add the show to the DB if the user is logged in
			$http.post('/addShow', {show : userShow});

			userShow = "";
		}

		//get Episode data of a show
		function getEpisodes(userShow){

			$http.get('http://api.tvmaze.com/shows/' + userShow.id + '/episodes?')
			.success(function(data){

				//store the data for every episode of the userShow in the upcomingEpisode Object
				for (i = 0; i < data.length; i++) {

					var Episode = {};
					var airdate = new Date(data[i].airstamp);
					var now = new Date();

					Episode.airdate = airdate.getMonth() + "." + airdate.getDate() + "." + airdate.getFullYear().toString().substring(2,4);
					Episode.airtime = airdate.toTimeString().substring(0,5);
				    Episode.name = data[i].name;
				    Episode.season = data[i].season;
				    Episode.runtime = data[i].runtime;
				    Episode.summary = data[i].summary.substring(3, data[i].summary.length - 4);

				    if (data[i].number < 10){
				    	Episode.epInSeason = "0" + data[i].number;
				    } else {
				    	Episode.epInSeason = data[i].number;
				    }

				    //if airdate is in the future, add to upcomingEpisodes array
					if (airdate > now){
				    	userShow.upcomingEpisodes.push(Episode);
					} else { 
						userShow.pastEpisodes.push(Episode);			    
					}
					//clean Episode object
					Episode = "";
				}

				//bring the seasons in order
				sortSeasons(userShow);
				return userShow;

			}).error(function(error){
				console.log(error);
			});
		}

		//sort seasons
		function sortSeasons(userShow){

			//figure out how many seasons the show has
			if (userShow.upcomingEpisodes.length > 0){
				var latestEpisode = userShow.upcomingEpisodes[userShow.upcomingEpisodes.length -1];
			} else {
				var latestEpisode = userShow.pastEpisodes[userShow.pastEpisodes.length -1];
			}
			var numberOfSeasons = latestEpisode.season;
			//create an array with that length
			for (j = 0;j< numberOfSeasons;j++){
				userShow.seasons.push([]);
			}
			//put the episodes in the right season
			for (p = 0; p < userShow.pastEpisodes.length; p++) {

				for ( i = 0; i <= numberOfSeasons; i++ ){
					if( userShow.pastEpisodes[p].season == i+1){
						userShow.seasons[i].push(userShow.pastEpisodes[p]);
					}
				}	
			}
			return userShow;
		}

		//delete a show from your list and remove it from the db
		$scope.deleteShow = function(show) {
			var i = $scope.userShows.indexOf(show);
			console.log(show.id);
			if (i > -1){
				$scope.userShows.splice(i, 1);
				$http.post('/rmShow', {showId : show.id });
			}
		}

		//delete a user account from the DB
		$scope.deleteAccount = function(){
			$http.post('/rmUser');
		}

		//select a season to watch
		$scope.selectSeason = function(number){
			$scope.selectedSeason = number;
		}
		


}]).directive('toggleClass', function() {
    return {
        restrict: 'A',
        link: function(scope, element, attrs) {
            element.bind('click', function() {
                element.toggleClass(attrs.toggleClass);
            });
        }
    };
});

