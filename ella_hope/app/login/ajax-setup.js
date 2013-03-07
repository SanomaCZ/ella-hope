/**
 * we need to add authorization header to each ajax request
 */
$.ajaxSetup({
	dataType: "json",
	contentType: "application/x-www-form-urlencoded; charset=UTF-8",
	crossDomain: true,
	beforeSend: function(jqXHR, settings) {
		jqXHR.withCredentials = true;
		if (USER.attr('api_key')) {
			jqXHR.setRequestHeader("Authorization", "ApiKey " + USER.attr('username') + ":" + USER.attr('api_key'));
		}
		return true;
	}
});

/**
 * global error handling
 * @param  {[type]} e         [description]
 * @param  {[type]} xhr       [description]
 * @param  {[type]} settings  [description]
 * @param  {[type]} exception [description]
 * @return {[type]}           [description]
 */
$(document).ajaxError(function(e, xhr, settings, exception) {
	if (xhr.status == 401) {
		//console.log('ERROR - login needed');
		$('body').trigger('show-login');
	}
	else {
		//console.log('ajax error ' + xhr.status);
	}
});
