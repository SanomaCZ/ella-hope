steal(
	'can/model',
	function ($) {
		Photo = can.Model({
			init: function () {
				// this.validate("title", function (val){
				// 	if (val === null || val === '') {
				// 		return $.t('This field can not be empty');
				// 	}
				// });
				// this.validate("source", function (val){
				// 	if (val === null || val === '') {
				// 		return $.t('This field can not be empty');
				// 	}
				// });
				this.validate("authors", function (val) {
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
			},

			findAll: function (params, success, error) {
				
				if (error == null) {
                    error = function(data, textStatus, jqXHR) {
					    alert("Error: findAll " + "/" + data.status + " / " + jqXHR);
					} 
				}				
				
				return $.ajax({
					url: BASE_URL + '/photo/',
					data: params,
					traditional: true,
					type: 'GET',
					async: true,
					dataType: "json",
					success: success,
					error: error
				});
			},

			findOne: 'GET ' + BASE_URL + '/photo/{id}/',
			update: function (id, attrs) {
				return $.ajax({
					url: BASE_URL + '/photo/' + id + '/',
					type: 'PATCH',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},
			destroy: 'DELETE ' + BASE_URL + '/photo/{id}/',

			getByTag: function (data, success, error) {

				var tagsArray = [],
					reId = /\/(\d+)\/$/,
					matchId;

				// from resource_uri we need to get only resource id
				// ["/admin-api/tag/3/"] -> 3
				$.each(data.tags, function (i, t) {
					// get id of given resource
					matchId = t.match(reId);
					if (matchId[1]) {
						tagsArray.push(parseInt(matchId[1], 10));
					}
				});

				// join found tag ids with semicolon
				var tags = tagsArray.join(';');

				return $.ajax({
					url: BASE_URL + '/tag/related/photo/' + tags + '/',
					data: {
						'exclude': data.assigned || []
					},
					traditional: true,
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
