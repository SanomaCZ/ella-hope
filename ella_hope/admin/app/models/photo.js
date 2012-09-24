steal(
	'can/model',
	function($) {
		Photo = can.Model({

			findAll: 'GET ' + BASE_URL + '/photo/',
			findOne: 'GET ' + BASE_URL + '/photo/{id}/',
			update : function(id, attrs){
    			return $.ajax({
      				url: BASE_URL+'/photo/'+id+'/',
      				type: 'PATCH',
      				async: false,
      				dataType: 'json',
      				contentType: 'application/json',
      				data: JSON.stringify(attrs)
      			})
  			},
  			destroy: 'DELETE ' + BASE_URL + '/photo/{id}/'
		}, {});
	}
);