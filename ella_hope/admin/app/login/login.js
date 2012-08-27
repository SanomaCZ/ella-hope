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
			loginPageClass: "login-page"
		}
	},
	/* @prototype */
	{
		/**
		 * Initializes a new instance of Login control.
		 */
		init : function(el, options){

			// if user is already logged in, skip login page
			if (User.checkLogin()) {
				//console.log('login success');
			}
			else {
				// show login page
				this.element.html(can.view(this.options.initView, this.options));

				// temporary class to enable different css for login page
				$('body').addClass(this.options.loginPageClass);
			}

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
				data = new Object();
			
			// get username and password
			$.each($('#login form').serializeArray(), function(i, field) {
    			data[field.name] = field.value;
			});

			if (data.username == '' && data.password == '') {
				return;
			}

			// authentication data
			var userData = {
				username: data.username,
				password: data.password
			};

			// user login
			var loginResult = User.login(userData);

			// if login is not successful
			if (loginResult && loginResult.error) {
				$("#login-error").show();
			}
			
		},

		"{USER} loggedIn": function() {
			var self = this;
			
			if (USER.attr('loggedIn')) {
				//console.log('USER logged in ;-)');
				$('body').removeClass(self.options.loginPageClass);
			}
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
								can.route.attr({page: 'user', action: 'login'});
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
)