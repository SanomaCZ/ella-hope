steal(
	'can/model',
	function($) {
		Listing = can.Model({
			init : function(){
				this.validate("publish_from", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
				this.validate("category", function (val){
					if (val === null || val === '' || typeof val == 'undefined') {
						return $.t('This field can not be empty');
					}
				});
			},
			findAll: 'GET ' + BASE_URL + '/listing/',
			findOne: 'GET ' + BASE_URL + '/listing/{id}/',

			create : function(attrs, success, error){
				return $.ajax({
					url: BASE_URL+'/listing/',
					type: 'POST',
					async: true,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs),	// JSON.stringify is necessary, it also escapes newline chars
					success: success,
					error: error
				});
			},

			update : function(id, attrs){
				return $.ajax({
					url: BASE_URL+'/listing/'+id+'/',
					type: 'PATCH',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/listing/{id}/',

			getListingByArticle: function(data, success, error) {
				return $.ajax({
					url: BASE_URL + '/listing/?publishable__id=' + data.articleId,
					type: 'GET',
					async: true,
					dataType: 'json',
					contentType: 'application/json',	// this is neccessary
					success: success,
					error: error
				});
			}


		}, {
			prefix: 'listing'

		});

	}
);
