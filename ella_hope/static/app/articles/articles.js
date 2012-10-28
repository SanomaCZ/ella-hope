steal(
	//'./css/search_result.css'
	'./create-article.js'
	, './article.css'
	, '//app/resources/js/bootstrap.min.js'
	, '//app/resources/js/bootbox.min.js'	// alert, confirm, flexible dialogs
	, '//app/resources/js/date.js'	// date parse
	, '//app/resources/js/bootstrap-datepicker.js'	// datepicker js
	, '//app/resources/css/bootstrap-datepicker.css'	// datepicker css
	, '//app/resources/js/bootstrap-timepicker.js'	// timepicker js
	, '//app/resources/css/bootstrap-timepicker.css'	// timepicker css
	, '//app/resources/js/jquery.chosen.js'	// select list js
	, '//app/resources/css/jquery.chosen.css'	// select list css
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
		articleCreate: null,	// control for creating/editing an article

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

			// destroy articleCreate control if it was created
			// this is useful is we i.e. edit an article and without saving or canceling
			// we go to article list... timer etc. needs to be destroyed
			if (this.articleCreate) {
				this.articleCreate.destroy();
			}

			this.element.html(can.view(this.options.initView, this.options));
			this.listArticles();
		},

		':page route': function( data ) {
			if (data.page == 'articles') {
				this.init();
			}
		},

		':page/:action route': function( data ) {
			if (data.action == 'new') {
				this.articleCreate = new ArticleCreate(this.element, {});
			}
		},

		':page/:action/:id route': function( data ) {

			var self = this;

			if (data.action == 'edit') {
				if (data.id > 0) {
					Article.findOne({id: data.id}, function(article){
						self.articleCreate = new ArticleCreate(self.element, {
							type: 'article',
							article: article,
							timer: self.autosaveTimer
						});
					});
				}
			}
			else if (data.action == 'edit-draft') {
				if (data.id > 0) {
					Draft.findOne({id: data.id}, function(draft){
						self.articleCreate = new ArticleCreate(self.element, {
							type: 'draft',
							article: draft,
							timer: self.autosaveTimer
						});
					});
				}
			}
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
					el.data('article').destroy();
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

			can.view('//app/articles/views/list-articles.ejs', {
				articles: Article.findAll()
			}).then(function( frag ){
				$("#inner-content").html( frag );
			});
		},

		destroy: function() {
			can.Control.prototype.destroy.call( this );
		}
	})
);