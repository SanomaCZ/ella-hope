steal(
	//'./default.css'					// application CSS file
	'can/control/route'					// enable routing
	, './login/login.js'				// login module
)
.then(
	'./models/models.js'				// steals all your models
	, './navbar/navbar.js'				// navigation bar
	, './dashboard/dashboard.js'		// dasbboard module
	, './articles/articles.js'			// articles module
	, './resources/js/jquery.jsperanto.js'	// translation library
	, './resources/js/jquery.cookie.js'	// cookies library
)
.then(
	function(){							// configure your application



		// disables all fixtures
		//can.fixture.on = false;

		// routes definition
		can.route( '', { page: 'dashboard' } );	// default route
		can.route( ":page" );
		can.route( ":page/:action" );
		can.route( ":page/:action/:id" );

		// we need to call this in order to get url params
		can.route.ready(true);
		
		// get url params
		var urlParams = can.route.attr();
		//console.log(can.route.attr());

		// language settings
		var lang,
			supportedLangs = ['cs', 'de', 'en', 'es', 'fr', 'gb', 'it']
			;
		if (urlParams['lang'])	// if language is in url
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
				
				$('body').trigger('show-login');
			},
			{
				"dicoPath":BASE_URL+"/app/resources/locales",
				"lang":lang // language is determined from browser settings by default
			}
		);

		var options = {};

		// when everything important is initialized, update the route so that 
		// controls waiting for route change can set the right state
		$('body').on('navbar-ready', function(){
			var data = can.route.attr();	// current route data
			data.load = 1;	// we add new attribute
			can.route.attr(data);	// set the "new" route -> change event
			data = can.route.attr();	// current route data
			delete data.load;	// delete newly added attribute to return to base state
			can.route.attr(data, true);	// set new route -> another change event
			$('body').off('navbar-ready');	// cancel listening
		});

		// after login is successful, launch the application
		$('body').on('login-success', function(){
			var navbar = new Navbar($("#navbar"), {});
		});

		$('body').on('show-login', function(){
			$("#navbar").empty();

			// login controller
			var login = new Login($("#content"), {});
		});

		// we send Authorization header with every ajax request
		// to ensure that user has the right privileges
		// only request where this header is not required is during login
		$.ajaxSetup({
		    dataType: "json",
		    contentType: "application/x-www-form-urlencoded; charset=UTF-8",
		    crossDomain: true,
		    beforeSend: function(jqXHR, settings) {
		    	//console.log($.cookie('api_key'));
		    	//console.log($.cookie('username'));
		    	jqXHR.withCredentials = true;
		    	if ($.cookie('api_key')) {
		        	jqXHR.setRequestHeader("Authorization", "ApiKey " + $.cookie('username') + ":" + $.cookie('api_key'));
		        }
		        return true;
		    }
		});
	}
)