steal(
	'can/model',
	function($) {
		Article = can.Model({
			init : function(){
				this.validate("content", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
				this.validate("category", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
				this.validate("title", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
				this.validate("slug", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
				this.validate("authors", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
				this.validate("publish_from", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
					// TODO - compare dates se that publish_from is not later then publish_to
					//<%= $.t('The end date can not be less then the start date') %>
				});
			},

			findAll: 'GET ' + BASE_URL + '/article/',

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

			create : function(attrs){
				return $.ajax({
					url: BASE_URL+'/article/',
					type: 'POST',
					async: false,
					dataType: 'json',
					contentType: 'application/json',	// this is necessary
					data: JSON.stringify(attrs)	// JSON.stringify is necessary, it also escapes newline chars
				});
			},

			update : function(id, attrs){
				return $.ajax({
					url: BASE_URL+'/article/'+id+'/',
					type: 'PATCH',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},

			destroy: 'DELETE ' + BASE_URL + '/article/{id}/',


			/**
			 * filter articles by tag
			 * $server/admin-api/tag/related/article/100;101;106/
			 * @param  {[type]} data [description]
			 * @return {[type]}      [description]
			 */
			getRelatedArticles : function(data) {
				var result = {};

				$.ajax({
					url: BASE_URL+'/tag/related/article/1;3/',
					type: 'GET',
					async: false,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(data),
					success : function(data, textStatus, xmlHttpRequest){
						result = data;
					},
					error : function(xhr, ajaxOptions, thrownError) {
						// console.log(xhr);
						// console.log(ajaxOptions);
						// console.log(thrownError);
						result = {
							error: true,
							message: thrownError
						};
					}
				});
				return result;
			}
		}, {});

		// article schema (when authorized)
		// curl --dump-header - -H "Content-Type: application/json" -H "Authorization: ApiKey mrpohoda:9ae83bcf3b11d6995d636acc6b87d82ec344e688" -X GET http://crawler.bfhost.cz:12345/admin-api/article/schema/?format=json

		// create article
		// curl --dump-header - -H "Content-Type: application/json" -H "Authorizkey:799eec8734b2b300f1710d4e67de08f388a63f12" -X POST --data '{"announced": false, "app_data": "{}", "authors": [{"description": "", "email": "", "id": 1, "name": "Seocity", "resource_uri": "/admin-api/author/1/", "slug": "seocity", "text": ""}], "category": {"app_data": "{}", "content": "", "description": "", "id": 1, "resource_uri": "/admin-api/category/1/", "slug": "category", "template": "category.html", "title": "Category", "tree_path": ""}, "content": "ěšířáš řčíáýšěřé", "description": "","last_updated": "2012-08-02T00:00:00", "listings": [], "photo": null, "publish_from": "2012-08-02T00:00:00", "publish_to": null, "published": true, "slug": "ajtatitle", "static": false, "title": "Ajta"}' http://crawler.bfhost.cz:12345/admin-api/article/

		// update article
		// curl --dump-header - -H "Content-Type: application/json"X H "Authorization: ApiKey mrpohoda:5fe3435159771c589839f07e4446fd32df4a619d" -X PATCH --data '{"content": "Nějaký pěkný utf-8 kontent :-)"}' http://crawler.bfhost.cz:12345/admin-api/article/1/

		// get articles
		//can.fixture('GET ' + BASE_URL + '/article/', '//app/models/fixtures/articles.json');

		// create
		// var id= 4;
		// can.fixture("POST /articles/create", function(){
		// 	// just need to send back a new id
		// 	return {id: (id++)}
		// });

		// // update
		// can.fixture("PUT /contacts/{id}", function(){
		// 	// just send back success
		// 	return {};
		// });

		// // destroy
		// can.fixture("DELETE /contacts/{id}", function(){
		// 	// just send back success
		// 	return {};
		// });
	}
);