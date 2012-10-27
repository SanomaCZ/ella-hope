steal(
	'can/model',
	function($) {
		Author = can.Model({

			findAll: 'GET ' + BASE_URL + '/author/',
			create : function(attrs){
    			return $.ajax({
      				url: BASE_URL+'/author/',
      				type: 'POST',
      				async: false,
      				dataType: 'json',
      				contentType: 'application/json',	// this is necessary
      				data: JSON.stringify(attrs)	// JSON.stringify is necessary, it also escapes newline chars
      			})
  			}

		}, {});
	}
);