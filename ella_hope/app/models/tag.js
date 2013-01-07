steal(
	'can/model',
	function($) {
		Tag = can.Model({

			findAll: 'GET ' + BASE_URL + '/tag/',
			findOne: 'GET ' + BASE_URL + '/tag/{id}/',
			create : function(attrs){
				return $.ajax({
					url: BASE_URL+'/tag/',
					type: 'POST',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/tag/{id}/'
		}, {});
	}
);