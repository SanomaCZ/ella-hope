steal(
	'can/model',
	function($) {
		User = can.Model({

			findAll: 'GET ' + BASE_URL + '/user/',

			login: function(userData) {
				var result = {};

				// Retrieve the object from storage
				var retrievedObject = localStorage.getItem('currentUserStorage');

				if (this.validateApiKey()) {
					console.log('api key valid');
				}

				USER.attr(retrievedObject);
				console.log(USER);

				$.ajax({
					type: 'POST',
					url: BASE_URL + '/login/',
					data: userData,
					dataType: 'json',
					async: false,
					success : function(data, textStatus, xmlHttpRequest){
						// console.log('success');
						// console.log(data);
						// console.log(textStatus);
						// console.log(xmLHttpRequest);
						// $.cookie('api_key', data.api_key);
						// $.cookie('username', user);

						USER.attr({
							loggedIn: true,
							api_key: data.api_key,
							username: userData.username
						});

						// Put the object into storage
						localStorage.setItem('currentUserStorage', JSON.stringify(USER));
					},
					error : function(xhr, ajaxOptions, thrownError) {
						// console.log('error');
						// console.log(xhr);
						// console.log(ajaxOptions);
						// console.log(thrownError);
						result = {
							error: true,
							message: thrownError
						};
					}
				});
				return result;
			},

			/**
			 * logout user - also delete local storage
			 * @return {[type]} [description]
			 */
			logout: function() {

				// delete the object in storage
				localStorage.setItem('currentUserStorage', null);

				var result;
				$.ajax({
					type: 'POST',
					url: BASE_URL + '/logout/',
					dataType: 'json',
					async: false,
					success : function(data, textStatus, xmlHttpRequest){
						result = true;
					},
					error : function(xhr, ajaxOptions, thrownError) {
						if (console && console.log) {
							console.log(thrownError);
						}
						result = false;
					}
				});
				//return result;
				// temporary, because of some network Error exception
				return true;
			},

			// if user is not logged in, check local storage
			// @return {[type]} [description]
			checkLogin : function() {

				var user = this.getUserFromLocalStorage();

				if (user && user['api_key']) {

					// set global variable USER - we need this because validateApiKey uses
					// POST request with credential header, which should be stored
					// in USER variable
					USER.attr(user);

					// check if api_key is valid
					if (this.validateApiKey()) {
						// key is valid, let's start the application
						return true;
					}
					else {
						// key is not valid, empty localStorage
						localStorage.setItem('currentUserStorage', null);
						return false;
					}
				}
				return false;
			},

			// get user from local storage
			getUserFromLocalStorage : function() {

				// Retrieve the object from storage
				return JSON.parse(localStorage.getItem('currentUserStorage'));
			},

			// validate api key to check if the user is still logged in
			validateApiKey : function() {
				var isValid = false;
				$.ajax({
					type: 'POST',
					url: BASE_URL + '/validate-api-key/',
					async: false,
					success : function(data, textStatus, xmlHttpRequest) {
						// if api key is valid, return true
						if (data.api_key_validity) {
							isValid = true;
						}
					},
					error : function(xhr, ajaxOptions, thrownError) {
						if (console && console.log) {
							console.log('error validating api key');
						}
					}
				});
				return isValid;
			}
		}, {});
	}
);