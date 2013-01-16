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
				// this.validate("photo", function (val){
				// 	if (val === null || val === '') {
				// 		return $.t('This field can not be empty');
				// 	}
				// });
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
			 * get articles by tags
			 * $server/admin-api/tag/related/article/100;101;106/
			 * @param  {array} data array of resource_uri
			 * @return {[type]}      [description]
			 */
			getArticlesByTag : function(data, success, error) {

				var tagsArray = [],
					reId = /\/(\d+)\/$/,
					matchId;

				// from resource_uri we need to get only resource id
				// ["/admin-api/tag/3/"] -> 3
				$.each(data, function(i, t) {
					// get id of given resource
					matchId = t.match(reId);
					if (matchId[1]) {
						tagsArray.push(parseInt(matchId[1], 10));
					}
				});

				// join found tag ids with semicolon
				var tags = tagsArray.join(';');

				return $.ajax({
					url: BASE_URL+'/tag/related/article/'+tags+'/',
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
			 * @param  {[type]} success   [description]
			 * @param  {[type]} error     [description]
			 * @return {[type]}           [description]
			 */
			getRelatedArticles : function(articleID, success, error) {

				return $.ajax({
					url: BASE_URL+'/related/?publishable__id='+articleID,
					type: 'GET',
					async: true,
					dataType: "json",
					success: success,
					error: error
				});
			},

			/**
			 * save related article to given article (make relation)
			 * @param {int} articleID given article to which we want to assign related article
			 * @param {int} relatedID related article
			 * @param {[type]} success   [description]
			 * @param {[type]} error     [description]
			 */
			addRelatedArticle : function(articleID, relatedID, success, error) {

				return $.ajax({
					url: BASE_URL+'/related/',
					type: 'POST',
					async: true,
					data: JSON.stringify({
						publishable: "/admin-api/article/"+articleID+"/",
						related: "/admin-api/article/"+relatedID+"/"
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
			deleteRelatedArticle : function(id, success, error) {

				return $.ajax({
					url: BASE_URL+'/related/'+id+'/',
					type: 'DELETE',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					success: success,
					error: error
				});
			}

			// (08:45:27 PM) miso.belica@jabbim.sk: Malo by to fungovať ako všetko ostatné.
				// /admin-api/related/?publishable__id=<id> ti vráti tie všetky pripojené related k danému článku.
				// (08:46:09 PM) miso.belica@jabbim.sk: A keď chceš tú reláciu znamazť tak pošleš
				// DELETE na /admin-api/related/<id_related_objektu>/
				// (08:46:47 PM) mr.pohoda@jabber.cz/744855381352898658915983: na uložení relace pošlu POST
				// a na to řazení se teda vykašleme?
				// (08:47:09 PM) miso.belica@jabbim.sk: Repektíve ty keď získaš related objekty z
				// admin-api/related/?publishable__id=<id> tak každý ten related obekt má resource_uri,
				// na ktoré keď pošleš DELETE tak ho zmažeš.

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
