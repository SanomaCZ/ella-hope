steal(
	'can/model',
	function($) {
		Photo = can.Model({

			findAll: 'GET ' + BASE_URL + '/photo/',

  			destroy: 'DELETE ' + BASE_URL + '/photo/{id}/'
		}, {});
	}
);