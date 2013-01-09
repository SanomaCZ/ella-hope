steal(
	'can/model',
	function($) {
		Photo = can.Model({
			init : function(){
				// this.validate("title", function (val){
				// 	if (val === null || val === '') {
				// 		return $.t('This field can not be empty');
				// 	}
				// });
				// this.validate("source", function (val){
				// 	if (val === null || val === '') {
				// 		return $.t('This field can not be empty');
				// 	}
				// });
				this.validate("authors", function (val){
					if (val === null || val === '') {
						return $.t('This field can not be empty');
					}
				});
			},

			findAll: 'GET ' + BASE_URL + '/photo/',
			findOne: 'GET ' + BASE_URL + '/photo/{id}/',
			update : function(id, attrs){
				return $.ajax({
					url: BASE_URL+'/photo/'+id+'/',
					type: 'PATCH',
					async: true,
					dataType: 'json',
					contentType: 'application/json',
					data: JSON.stringify(attrs)
				});
			},
			destroy: 'DELETE ' + BASE_URL + '/photo/{id}/'
		}, {});
	}
);