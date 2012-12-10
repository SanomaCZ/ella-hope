/*

	common configration file for Hope
	(you can override "/config/" in your webserver quod libet)

	items:

	- backend servers
	- key-value configuration object
*/

/*
	Example login backends for Hope

	If you want to override them, keep this json structure and function name.
 */

function getBackends() {
	return [
		{
			'name': "Crawler",
			'url': 'http://crawler.bfhost.cz:1024/admin-api'
		},
		{
			'name': "DEV Crawler",
			'url': 'http://crawler.bfhost.cz:3456/admin-api'
		},
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
		'COOKIE_FILTER': 'HOPE_filter_form'
	}
})();
