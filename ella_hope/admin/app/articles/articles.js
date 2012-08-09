steal(
	//'./css/search_result.css'
	'./create-article.js'
	, './article.css'
	, '//app/resources/js/bootstrap.min.js'
	, '//app/resources/js/bootbox.min.js',	// alert, confirm, flexible dialogs
	'//app/resources/js/date.js',	// date parse
	'//app/resources/js/bootstrap-datepicker.js',	// datepicker js
	'//app/resources/css/bootstrap-datepicker.css',	// datepicker css
	'//app/resources/js/bootstrap-timepicker.js',	// timepicker js
	'//app/resources/css/bootstrap-timepicker.css'	// timepicker css
)
.then(

	/**
	 * Shows the articles.
	 * @tag controllers, home
	 */
	Articles = can.Control(
	/* @static */
	{
		defaults: {
			initView : "//app/articles/views/init.ejs"
		}
	},
	/* @prototype */
	{
		/**
		 * Initializes a new instance of Articles container.
		 * @codestart
		 * $(selector).skimapnet_search_result({
		 *	modelType : skimapnet.Models.Google,
		 *  listenTo : $('#searchBox')
		 * })
		 * @codeend
		 */
		init: function(element, options){

			this.element.html(can.view(this.options.initView, this.options));

			// show the list of articles
			this.listArticles();

			// create form for new article
			var create = new Create('#create', {
				categories: {}
			});

			this.element.trigger('articles-ready');
		},

		':page/:action/:id route': function( data ) {
			//console.log(data);
			if (data.page == 'articles') {
				if (data.action == 'edit') {
					if (data.id > 0) {
						Article.findOne({id: data.id}, function(article){
							$('#create').data('controls')[0].show(article);
							//create.show(article);
						})
					}
				}
			}
   // 			if (newVal == "dashboard") {
			//  	this.element.html(can.view(this.options.initView, this.options));
			// }
        },

		/**
		 * delete article
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.delete click': function(el, ev){

			ev.preventDefault();

			bootbox.confirm(el.data('confirm'), function(confirmed) {
				if (confirmed) {
					//el.data('article').destroy();
					el.closest('tr').slideUp(200);
				}
			});
		},

		/**
		 * list articles
		 * @return {[type]} [description]
		 */
		'listArticles': function() {

			var self = this;
			//this.element.html(can.view(this.options.initView, this.options));

			// Article.findAll().each(function(data){
			// 	console.log(data);
			// })

			can.view('//app/articles/views/list-articles.ejs', {
				articles: Article.findAll()
			}).then(function( frag ){
				$("#inner-content").html( frag )
			});
		}
	})
)