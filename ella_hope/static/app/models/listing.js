steal(
	'can/model',
	function($) {
		Listing = can.Model({

			findAll: 'GET ' + BASE_URL + '/listing/'
			
			
		}, {});

	}
);