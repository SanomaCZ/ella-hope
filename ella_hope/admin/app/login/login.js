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
			bodyClass: "login-page"
		}
	},
	/* @prototype */
	{
		/**
		 * Initializes a new instance of Login control.
		 */
		init : function(el, options){

			if ($.cookie('api_key')) {
				$('body').trigger('login-success');
			}
			else {

				this.element.html(can.view(this.options.initView, this.options));

				// temporary class to enable different css for login page
				$('body').addClass(this.options.bodyClass);
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
			
			$.each($('#login form').serializeArray(), function(i, field) {
    			data[field.name] = field.value;
			});

			if (data.username == '' && data.password == '') {
				return;
			}

			var user = data.username;
			var pass = data.password;

			$.ajax({
				type: 'POST',
				url: 'http://crawler.bfhost.cz:12345/admin-api/login/',
				data: {
					"username": user,
					"password": pass
				},
				dataType: 'json',
				success : function(data, textStatus, xmLHttpRequest){
			  		// console.log('success');
			  		// console.log(data);
			  		// console.log(textStatus);
			  		// console.log(xmLHttpRequest);
			  		$.cookie('api_key', data.api_key);
			  		$.cookie('username', user);

					$('body')
						.removeClass(self.options.bodyClass)
						.trigger('login-success')
						;
			  	},
			  	error : function(xhr, ajaxOptions, thrownError) {
			  		if (console && console.log) {
				    	console.log('error');
				    	console.log(xhr);
				    	console.log(ajaxOptions);
				    	console.log(thrownError);
				    }
			  	}
			});
		},

		':page/:action route': function( data ) {
			if (data.page == 'user') {
				switch (data.action) {
					case 'login' :
						$('body').trigger('show-login');
						break;
					case 'logout' :
						$.cookie('api_key', null);
						$.cookie('username', null);
						setTimeout(function(){
							can.route.attr({page: 'user', action: 'login'});
						}, 500);
						//$('body').trigger('show-login');
						break;
				}
			}
			return true;
		}
	})
)