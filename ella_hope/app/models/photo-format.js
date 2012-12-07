steal(
	'can/model',
	function($) {
		PhotoFormat = can.Model({

			findAll: 'GET ' + BASE_URL + '/format/',
			findOne: 'GET ' + BASE_URL + '/format/{id}/'
		}, {});
	}
);