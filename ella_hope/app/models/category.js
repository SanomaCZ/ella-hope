steal(
	'can/model',
	function($) {
		Category = can.Model({

			findAll: 'GET ' + BASE_URL + '/category/',

			/**
			 * find Encyclopedia category - id can be different on every server
			 * so we use slug to find its id
			 * @param  {[type]} data    [description]
			 * @param  {[type]} success [description]
			 * @param  {[type]} error   [description]
			 * @return {[type]}         [description]
			 */
			getEncyclopediaCategory : function(data, success, error) {

				return $.ajax({
					url: BASE_URL+'/category/?slug=encyklopedie',
					type: 'GET',
					async: true,
					dataType: "json",
					success: success,
					error: error
				});
			}

		}, {});

	}
);