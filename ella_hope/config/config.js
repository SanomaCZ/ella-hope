/*

	common configration file for Hope
	(you can override "/config/" in your webserver quod libet)

	items:

	- backend servers
	- key-value configuration object
*/
var HOPE_VERSION = "";
/*
	Example login backends for Hope

	If you want to override them, keep this json structure and function name.
 */

function getBackends() {
	return [
		{
			'name': "Localhost",
			'url': 'http://localhost:8000/admin-api'
		},
		{
			'name': "DaZ",
			'url': 'http://www.dumazahrada.cz/admin-api'
		}
	]
}


/*
	Common configuration directives

	Store them in window.HOPECFG as an key-value object
 */

(function () {
	window.HOPECFG = {
		APP_ROOT: '//app' + HOPE_VERSION ,
		COOKIE_FILTER: 'HOPE_filter_form'
		, RAVEN_DSN: false
	}
})();
