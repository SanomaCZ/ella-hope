steal(
	'can/model',
	function($) {
		Article = can.Model({

			findAll: 'GET ' + BASE_URL + '/article/',
			
			/*
			// this worked if returned json was not ideal for findAll
			// ideal means there should be an array of items in the first level of json
			findAll : function(params, success, error){
				var self= this;
				return can.ajax({
					url : "http://crawler.bfhost.cz:12345/api/resources/article/",
					data : params,
					dataType : "json"
				}).pipe(function(data){
					// returned json is not standardized for canJS
					// http://donejs.com/docs.html#!can.Model.static.findAll
					// therefore we need to return only the valid part
					//return self.models(data.objects);
					return self.models(data);
				});
			},
			 */

			//findOne: 'http://admin.snowhit.com/skicentres/index/skicentres-detail/id/{id}'
			findOne : function(params){
    			return $.ajax({
      				url: BASE_URL+'/articles/index/articles-detail/id/' + params.id,
      				type: 'get',
      				async: false,
      				dataType: 'json'})
  			},
  			create: 'POST /articles/create'
		}, {});

		// get articles
		//can.fixture('GET ' + BASE_URL + '/article/', '//app/models/fixtures/articles.json');
		
		// create
		var id= 4;
		can.fixture("POST /articles/create", function(){
			// just need to send back a new id
			return {id: (id++)}
		});

		// update
		can.fixture("PUT /contacts/{id}", function(){
			// just send back success
			return {};
		});

		// destroy
		can.fixture("DELETE /contacts/{id}", function(){
			// just send back success
			return {};
		});
	}
);