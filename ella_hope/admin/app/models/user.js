steal(
	'can/model',
	function($) {
		User = can.Model({

  			findAll: 'POST http://crawler.bfhost.cz:12345/admin-api/login/',
  			
		}, {});
	}
);