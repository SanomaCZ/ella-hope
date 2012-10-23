steal(
	'can/model',
	function($) {
		Category = can.Model({

			findAll: 'GET ' + BASE_URL + '/category/'
			
			
		}, {});

	}
);