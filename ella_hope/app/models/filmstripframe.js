steal(
	'can/model',
	function($) {
		FilmstripFrame = can.Model({
			init: function () {
				var self = this;

				$.each(self.prototype.required, function () {
					self.validate(this, function (val) {
						if (val === null || val === '') {
							return $.t('This field can not be empty');
						}
					});
				})
			},

			findAll: 'GET ' + BASE_URL + '/frame/',

			findOne: 'GET ' + BASE_URL + '/frame/{id}/',

			create : function(attrs){
				return $.ajax({
					url: BASE_URL+'/frame/',
					type: 'POST',
					async: false,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs)
				});
			},

			update : function(id, attrs){
				return $.ajax({
					url: BASE_URL+'/frame/'+id+'/',
					type: 'PATCH',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/frame/{id}/',



			/**
			 * get frames related (connected) to a given filmstrip
			 * @param  {[type]} filmstripID [description]
			 * @return {[type]}           [description]
			 */
			getRelated : function(filmstripID) {
				var res = [];
				return $.ajax({
					url: BASE_URL+'/frame/?filmstrip__id='+filmstripID+'&order_by=id',
					type: 'GET',
					async: true,
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
		}, {
			required: ['content']
		});

	}
);
