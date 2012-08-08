steal(
	'can/model',
	function($) {
		User = can.Model({

			// login
			// curl --dump-header - -H "Content-Type: application/json" -X POST --data 'username=mrpohoda&password=mrpohoda' http://crawler.bfhost.cz:12345/admin-api/login/

			// logout
			// curl --dump-header - -H "Content-Type: application/json" -H "Authorization: ApiKey mrpohoda:5fe3435159771c589839f07e4446fd32df4a619d" -X POST http://crawler.bfhost.cz:12345/admin-api/logout/


  			findAll: 'POST http://crawler.bfhost.cz:12345/admin-api/login/',
  			
		}, {});
	}
);