steal(
	'can/model',
	function($) {
		/**
		 * gallery inherits from Article model
		 * it's basically the same, except galleryitem can be added only to gallery
		 * @type {[type]}
		 */
		Gallery = Article({

			findAll: 'GET ' + BASE_URL + '/gallery/',

			findOne: 'GET ' + BASE_URL + '/gallery/{id}/',

			create : function(attrs){
				return $.ajax({
					url: BASE_URL+'/gallery/',
					type: 'POST',
					async: false,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs)	// JSON.stringify is necessary, it also escapes newline chars
				});
			},

			update : function(id, attrs){
				return $.ajax({
					url: BASE_URL+'/gallery/'+id+'/',
					type: 'PATCH',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/gallery/{id}/'

		}, {});
	}
);
