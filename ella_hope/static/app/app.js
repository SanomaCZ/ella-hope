steal(
	'./app.css'					// application CSS file
	, 'can/control/route'					// enable routing
	, './login/login.js'				// login module
)
.then(
	'./resources/js/jquery.jsperanto.js'	// translation library
)
.then(
	function(){	// configure your application

		// BASE_URL will be set when user logs in
		BASE_URL = '';

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
				"dicoPath":location.path+"resources/locales",
				"lang":lang // language is determined from browser settings by default
			}
		);

		// show login screen if user is not logged in
		$('body').on('show-login', function(){

			// hide navbar
			$("#navbar").empty();

			// login controller
			var login = new Login($("#content"));
		});
	}
)
.then(
	function(){							// configure your application

		// when user succesfully logs in
		$('body').on('user-logged', function(){

			// steal the rest files
			steal(
				'./models/models.js'				// steals all your models
				, './navbar/navbar.js'				// navigation bar
				, './dashboard/dashboard.js'		// dasbboard module
				, './articles/articles.js'			// articles module
				, './photos/photos.js'				// photos module
			)
			.then(
				// run the application
				function(){

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

					var navbar = new Navbar($("#navbar"));
				}
			);
		});
		// when everything important is initialized, update the route so that
		// controls waiting for route change can set the right state
		$('body').on('navbar-ready', function(){
			can.route.ready(true);
			$('body').off('navbar-ready');	// cancel listening
		});
	}
);