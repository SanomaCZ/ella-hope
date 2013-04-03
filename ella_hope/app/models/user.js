steal(
	'can/model',
	function($) {
		User = can.Model({

			findAll: 'GET ' + BASE_URL + '/user/',

			login: function(userData) {
				var result = {};

				// Retrieve the object from storage
				var retrievedObject = localStorage.getItem('currentUserStorage');

				USER.attr(retrievedObject);
				//console.log(USER);

				$.ajax({
					type: 'POST',
					url: BASE_URL + '/login/',
					data: userData,
					dataType: 'json',
					async: false,
					success : function(data, textStatus, xmlHttpRequest){

						USER.attr({
							loggedIn: true,
							api_key: data.api_key,
							username: userData.username,
							user_id: data.user_id,
							auth_tree: data.auth_tree,
							base_url: BASE_URL
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
			}
		}, {});
	}
);
