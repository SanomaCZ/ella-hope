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
			 * @param  {[type]} success   [description]
			 * @param  {[type]} error     [description]
			 * @return {[type]}           [description]
			 */
			getRelated : function(galleryID, success, error) {

				return $.ajax({
					url: BASE_URL+'/galleryitem/?gallery__id='+galleryID,
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
