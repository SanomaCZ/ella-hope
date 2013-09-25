steal(
	'can/model',
	function($) {
		GalleryItem = can.Model({

			findAll: 'GET ' + BASE_URL + '/galleryitem/',

			findOne: 'GET ' + BASE_URL + '/galleryitem/{id}/',

			create : function(attrs){
				return $.ajax({
					url: BASE_URL+'/galleryitem/',
					type: 'POST',
					async: false,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs)
				});
			},

			update : function(id, attrs){
				return $.ajax({
					url: BASE_URL+'/galleryitem/'+id+'/',
					type: 'PATCH',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/galleryitem/{id}/',



			/**
			 * get photos related (connected) to a given gallery
			 * @param  {[type]} articleID [description]
			 * @return {[type]}           [description]
			 */
			getRelated : function(galleryID) {
				var res = [];

				$.ajax({
					url: BASE_URL + '/galleryitem/?gallery__id=' + galleryID + '&order_by=order',
					type: 'GET',
					async: false,
					dataType: "json",
					success: function(data) {
						if ('meta' in data) {
							res = data.data;
						} else {
							res = data;
						}
					}
				});
				return res;
			}
		}, {});

	}
);
