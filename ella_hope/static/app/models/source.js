steal(
	'can/model',
	function($) {
		Source = can.Model({

			findAll: 'GET ' + BASE_URL + '/source/',
			findOne: 'GET ' + BASE_URL + '/source/{id}/',
			create : function(attrs){
          return $.ajax({
            url: BASE_URL+'/source/',
            type: 'POST',
            async: false,
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify(attrs)
          });
      },
      destroy: 'DELETE ' + BASE_URL + '/source/{id}/'
		}, {});
	}
);