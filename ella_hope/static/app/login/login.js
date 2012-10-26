steal(
	'./login.css'
	, 'can/view/ejs'
)
.then(
	/**
	 * Shows the login form.
	 *
	 * @tag controllers
	 */
	Login = can.Control(
	/* @static */
	{
		defaults: {
			initView : "//app/login/views/init.ejs",
			loginPageClass: "login-page",
			api_url: [
				{
					'name': "Crawler",
					'url':'http://crawler.bfhost.cz:12345/admin-api'
				},
				{
					'name': "DEV Crawler",
					'url':'http://crawler.bfhost.cz:3456/admin-api'
				},
				{
					'name': "Localhost",
					'url':'http://localhost:8000/admin-api'
				},
				{
					'name': "DaZ",
					'url':'http://www.dumazahrada.cz/admin-api'
				}
			]
		}
	},
	/* @prototype */
	{
		/**
		 * Initializes a new instance of Login control.
		 */
		init : function(el, options){

			// if user is already logged in, skip login page
			this.checkLogin();
		},

		/**
		 * login button clicked
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#submit click': function(el, ev){

			ev.preventDefault();

			var self = this,
				data = {};

			// get username and password
			$.each($('#login form').serializeArray(), function(i, field) {
				data[field.name] = field.value;
			});

			if (data.username === '' && data.password === '') {
				$("#login-error").show();
				return;
			}

			// set BASE_URL based on user input
			// user can select predefined url or enter a new one
			BASE_URL = data.api_url_custom ? data.api_url_custom : data.api_url;

			// authentication data
			var userData = {
				username: data.username,
				password: data.password
			};

			// steal User model so that login can be performed
			steal(
				'//app/models/user.js', '//app/login/ajax-setup.js'
			)
			.then(
				function(){

					// current user
					USER = new User({
						loggedIn: false
					});

					// user login
					var loginResult = User.login(userData);

					// if login is not successful
					if (loginResult && loginResult.error) {
						$("#login-error").show();
					}
					else {
						self.loginSuccess();
					}
				}
			);
		},

		/**
		 * change event in api_url select
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		"#api_url change": function(el, ev) {

			// if selected value is 0, we want to enter custom url
			if (el.val() === '0') {
				$('#api_url_custom').removeAttr('disabled').show();
			}
			else {
				$('#api_url_custom').attr('disabled', 'disabled').hide();
			}
		},

		/**
		 * if user is not logged in, check local storage
		 * @return {[type]} [description]
		 */
		checkLogin : function() {

			var user = this.getUserFromLocalStorage();

			var self = this;

			if (user && user['api_key'] && user['base_url']) {

				BASE_URL = user['base_url'];

				// steal User model so that login can be performed
				steal('//app/models/user.js', '//app/login/ajax-setup.js')
				.then(
					function(){

						// set global variable USER - we need this because validateApiKey uses
						// POST request with credential header, which should be stored
						// in USER variable
						/// current user
						USER = new User({
							loggedIn: false
						});
						USER.attr(user);

						//console.log(USER);

						// check if api_key is valid
						if (self.validateApiKey()) {
							// key is valid, let's start the application
							self.loginSuccess();
						}
						else {
							// key is not valid, empty localStorage
							localStorage.setItem('currentUserStorage', null);
							self.loginError();
						}
					}
				);
			}
			else {
				self.loginError();
			}
		},

		/**
		 * if user is succesfully logged in
		 * @return {[type]} [description]
		 */
		loginSuccess: function() {

			$('body').removeClass(this.options.loginPageClass);
			$('body').trigger('user-logged');
		},

		/**
		 * if user is not logged in
		 * @return {[type]} [description]
		 */
		loginError: function() {

			// show login page
			this.element.html(can.view(this.options.initView, this.options));

			// temporary class to enable different css for login page
			$('body').addClass(this.options.loginPageClass);
		},

		/**
		 * get user from local storage
		 * @return {[type]} [description]
		 */
		getUserFromLocalStorage : function() {

			// Retrieve the object from storage
			return JSON.parse(localStorage.getItem('currentUserStorage'));
		},

		/**
		 * validate api key to check if the user is still logged in
		 * @return {[type]} [description]
		 */
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
		},

		':page/:action route': function( data ) {
			if (data.page == 'user') {
				switch (data.action) {
					case 'login' :
						$('body').trigger('show-login');
						break;
					case 'logout' :
						//$.cookie('api_key', null);
						//$.cookie('username', null);

						if (User.logout()) {
							USER.attr({
								loggedIn: false
							});
							setTimeout(function(){
								can.route.attr({page: 'user', action: 'login'}, true);
								//$('body').trigger('show-login');
							}, 500);
							//$('body').trigger('show-login');
						}
						else {
							if (console && console.log) {
								console.log('ERROR - user logout');
							}
						}
						break;
				}
			}
			return true;
		}
	})
);
