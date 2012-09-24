steal(
	'./app.css'					// application CSS file
	, 'can/control/route'					// enable routing
	, './login/login.js'				// login module
)
.then(
	'./models/models.js'				// steals all your models
	, './navbar/navbar.js'				// navigation bar
	, './dashboard/dashboard.js'		// dasbboard module
	, './articles/articles.js'			// articles module
	, './photos/photos.js'				// photos module
	, './resources/js/jquery.jsperanto.js'	// translation library
	, './resources/js/jquery.cookie.js'	// cookies library
)
.then(
	function(){							// configure your application

		// current user
		USER = new User({
			loggedIn: false
		});

		// disables all fixtures
		//can.fixture.on = false;

		// routes definition
		can.route( '', { page: 'dashboard' } );	// default route
		can.route( ":page" );
		can.route( ":page/:action" );
		can.route( ":page/:action/:id" );

		// we need to set can.route.ready to true in order to get url params
		// with false we suspend route init
		can.route.ready(false);
		
		// language settings
		var lang,
			supportedLangs = ['cs', 'de', 'en', 'es', 'fr', 'gb', 'it'];

		if ( 0 && urlParams['lang'])	// #TODO if language is in localStorage
			lang = urlParams['lang'];
		else	// we take the language from browser
			lang = (navigator.language) ? navigator.language : navigator.userLanguage;
		// if the language is not supported, english is defautl
		if (jQuery.inArray(lang, supportedLangs) == -1)
			lang = 'en';

		// temporary language fixed settings
		lang = 'en';

		// jsperanto initialization - translations
		// when translations are ready, we can initialize modules which then may be translated
		$.jsperanto.init(
			function(t){
				//console.log($.t('france'));
				
				// show login page
				// if user is already logged in, login page is skipped
				$('body').trigger('show-login');
			},
			{
				"dicoPath":BASE_URL+"/app/resources/locales",
				"lang":lang // language is determined from browser settings by default
			}
		);

		// when everything important is initialized, update the route so that 
		// controls waiting for route change can set the right state
		$('body').on('navbar-ready', function(){
			can.route.ready(true);
			$('body').off('navbar-ready');	// cancel listening
		});

		// when login is successful, launch the application
		USER.bind( 'loggedIn', function( ev, newVal, oldVal ) {
			//console.log( 'loggedIn changed to', newVal );
			if (newVal == true) {
				var navbar = new Navbar($("#navbar"));
			}
		});

		// show login screen if user is not logged in
		$('body').on('show-login', function(){
			//console.log('show-login');
			
			// hide navbar
			$("#navbar").empty();

			// login controller
			var login = new Login($("#content"));
		});

		// we send Authorization header with every ajax request
		// to ensure that user has the right privileges
		// only request where this header is not required is during login
		var request = $.ajaxSetup({
		    dataType: "json",
		    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		    crossDomain: true,
		    beforeSend: function(jqXHR, settings) {
		    	//console.log(USER.attr('username'));
		    	jqXHR.withCredentials = true;
		    	if (USER.attr('api_key')) {
		        	jqXHR.setRequestHeader("Authorization", "ApiKey " + USER.attr('username') + ":" + USER.attr('api_key'));
		        }
		        return true;
		    }
		});

		// global error handling
		$(document).ajaxError(function(e, xhr, settings, exception) {
			if (xhr.status == 401) {
				console.log('ERROR - login needed');
				$('body').trigger('show-login');
			}
			else {
				//console.log('ajax error ' + xhr.status);
			}
		}); 
	}
)