steal(
	'can/model',
	function ($) {
		WikiPage = can.Model({

			findAll: 'GET ' + BASE_URL + '/wikipage/',
			findOne: 'GET ' + BASE_URL + '/wikipage/',
			update: function (id, attrs) {
				return $.ajax({
					url: BASE_URL + '/wikipage/' + slug + '/',
					type: 'PATCH',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},
			destroy: 'DELETE ' + BASE_URL + '/wikipage/{slug}/'
		}, {});
	}
);
