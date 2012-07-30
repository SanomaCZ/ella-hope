steal(
	//'./css/search_result.css'
	'./create-article.js'
	//, '//can/can.fixture.js'
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
			new Create('#create', {
				categories: {}
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