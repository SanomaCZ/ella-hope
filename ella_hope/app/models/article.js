steal(
	'can/model',
	function ($) {
		Article = can.Model({
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
			findAll: function (params, success, error) {
				
				if (error == null) {
                    error = function(data, textStatus, jqXHR) {
					    alert("Error: findAll " + "/" + data.status + " / " + jqXHR);
					} 
				}
				
				return $.ajax({
					url: BASE_URL + '/article/',
					data: params,
					traditional: true,
					type: 'GET',
					async: true,
					dataType: "json",
					success: success,
					error: error
				});
			},
			//findAll: 'GET ' + BASE_URL + '/article/',

			// this worked if returned json was not ideal for findAll
			// ideal means there should be an array of items in the first level of json
			// or in _data attribute
			// findAll : function(params, success, error){
			//	var self= this;
			//	return can.ajax({
			//		url : "http://crawler.bfhost.cz:12345/api/resources/article/",
			//		data : params,
			//		dataType : "json"
			//	}).pipe(function(data){
			//		// returned json is not standardized for canJS
			//		// http://donejs.com/docs.html#!can.Model.static.findAll
			//		// therefore we need to return only the valid part
			//		//return self.models(data.objects);
			//		return self.models(data);
			//	});
			//},

			findOne: 'GET ' + BASE_URL + '/article/{id}/',

			create: function (attrs) {
				return $.ajax({
					url: BASE_URL + '/article/',
					type: 'POST',
					async: false,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs)	// JSON.stringify is necessary, it also escapes newline chars
				});
			},

			update: function (id, attrs) {
				return $.ajax({
					url: BASE_URL + '/article/' + id + '/',
					type: 'PATCH',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/article/{id}/',

			/**
			 * get articles by tags
			 * $server/admin-api/tag/related/article/100;101;106/
			 * @param  {array} data array of resource_uri
			 * @return {[type]}      [description]
			 */
			getArticlesByTag: function (data, success, error) {

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
					url: BASE_URL + '/tag/related/article/' + tags + '/',
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
			},

			/**
			 * get articles related (connected) to a given article
			 * @param  {[type]} articleID [description]
			 * @return {[type]}           [description]
			 */
			getRelatedArticles: function (articleID) {
				var res = [];
				$.ajax({
					url: BASE_URL + '/related/?publishable__id=' + articleID,
					type: 'GET',
					async: false,
					dataType: "json",
					success: function(data) {
						if ('meta' in data) {
							res = data.data;
						} else {
							//backward compatibility for datasource w/o metadata
							res = data;
						}
					},
					error: function(data, textStatus, jqXHR) {
					    alert("Error: Related articles" + " / "  + data.status + " / " + jqXHR);
					}
				})
				return res;
			},

			/**
			 * save related article to given article (make relation)
			 * @param {int} articleID given article to which we want to assign related article
			 * @param {int} relatedID related article
			 * @param {[type]} success   [description]
			 * @param {[type]} error     [description]
			 */
			addRelatedArticle: function (articleID, relatedID, success, error) {

				return $.ajax({
					url: BASE_URL + '/related/',
					type: 'POST',
					async: true,
					data: JSON.stringify({
						publishable: "/admin-api/article/" + articleID + "/",
						related: "/admin-api/article/" + relatedID + "/"
					}),
					dataType: 'json',
					contentType: 'application/json',
					success: success,
					error: error
				});
			},

			/**
			 * delete relation between article and it's related article
			 * @param  {int} id      relation id
			 * @param  {[type]} success [description]
			 * @param  {[type]} error   [description]
			 * @return {[type]}         [description]
			 */
			deleteRelatedArticle: function (id, success, error) {

				return $.ajax({
					url: BASE_URL + '/related/' + id + '/',
					type: 'DELETE',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					success: success,
					error: error
				});
			}

		}, {
			required: ['content', 'category', 'title', 'slug', 'authors', 'publish_from']
		});
	}
);
