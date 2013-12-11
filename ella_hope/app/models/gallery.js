steal(
	'can/model',
	function ($) {

		/**
		 * gallery inherits from Article model
		 * it's basically the same, except galleryitem can be added only to gallery
		 * @type {[type]}
		 */
		Gallery = Article({
			init: function () {
				var self = this;

				$.each(self.prototype.required, function () {
					self.validate(this, function (val) {
						if (val === null || val === '') {
							return $.t('This field can not be empty');
						}
					});
				})

				// TODO - compare dates se that publish_from is not later then publish_to
				//<%= $.t('The end date can not be less then the start date') %>
			},

			findAll: 'GET ' + BASE_URL + '/gallery/',

			findOne: 'GET ' + BASE_URL + '/gallery/{id}/',

			create: function (attrs) {
				return $.ajax({
					url: BASE_URL + '/gallery/',
					type: 'POST',
					async: true,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs)	// JSON.stringify is necessary, it also escapes newline chars
				});
			},

			update: function (id, attrs) {
				return $.ajax({
					url: BASE_URL + '/gallery/' + id + '/',
					type: 'PATCH',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/gallery/{id}/'

		}, {
			required: ['category', 'title', 'slug', 'authors', 'publish_from']
		});
	}
);
