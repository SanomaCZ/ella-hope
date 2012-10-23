steal(
	'can/model',
	function($) {
		Author = can.Model({

			findAll: 'GET ' + BASE_URL + '/author/',

		}, {});
	}
);