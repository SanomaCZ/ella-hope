steal(
	'can/model',
	function($) {
		Draft = can.Model({

			findAll: 'GET ' + BASE_URL + '/draft/',
			findOne: 'GET ' + BASE_URL + '/draft/{id}/',

  			create : function(attrs){
    			return $.ajax({
      				url: BASE_URL+'/draft/',
      				type: 'POST',
      				async: false,
      				dataType: 'json',
      				contentType: 'application/json',	// this is necessary
      				data: JSON.stringify(attrs)	// JSON.stringify is necessary, it also escapes newline chars
      			})
  			},

  			update : function(id, attrs){
    			return $.ajax({
      				url: BASE_URL+'/draft/'+id+'/',
      				type: 'PATCH',
      				async: false,
      				dataType: 'json',
      				contentType: 'application/json',
      				data: JSON.stringify(attrs)
      			})
  			},

  			destroy: 'DELETE ' + BASE_URL + '/draft/{id}/'
		}, {});
	}
);