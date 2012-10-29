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
			initView : "//app/articles/views/init.ejs",
			articleStates: ["added", "ready", "approved", "published", "postponed",	"deleted"],
			dateOptions: {	// https://github.com/eternicode/bootstrap-datepicker
				format: 'yyyy-mm-dd',
				weekStart: 1,
				autoclose: true
			}
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

			var self = this;

			// destroy articleCreate control if it was created
			// this is useful if we i.e. edit an article and without saving or canceling
			// we go to article list... timer etc. needs to be destroyed
			if (this.articleCreate) {
				this.articleCreate.destroy();
			}

			can.view('//app/articles/views/init.ejs', {
				author: Author.findAll(),
				category: Category.findAll(),
				states: this.options.articleStates
			}).then(function( frag ){
				self.element.html( frag );
			}).then(function(){
				// enable datepicker for publishFrom and publishTo
				// https://github.com/eternicode/bootstrap-datepicker
				$("input[name=publish_from]").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						self.filterArticles();
					});
				$("input[name=publish_to]").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						self.filterArticles();
					});

				$(".filter-form select").on('change', function(ev){
						self.filterArticles();
				});

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen({allow_single_deselect:true});
			});

			//this.element.html(can.view(this.options.initView, this.options));

			// list articles
			this.listArticles({});
		},

		':page route': function( data ) {
			if (data.page == 'articles') {
				this.init();
			}
		},

		':page/:action route': function( data ) {
			if (data.action == 'new') {
				this.articleCreate = new ArticleCreate(this.element, this.options);
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
							articleStates: self.options.articleStates,
							dateOptions: self.options.dateOptions
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
							articleStates: self.options.articleStates,
							dateOptions: self.options.dateOptions
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
		'listArticles': function(data) {

			var self = this;

			can.view('//app/articles/views/list-articles.ejs', {
				articles: Article.findAll(data)
			}).then(function( frag ){
				$("#inner-content").html( frag );
			});
		},

		/**
		 * search articles based on title
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.search-articles click' : function(el, ev) {

			ev.preventDefault();

			// get search term
			var search = el.siblings('input.search-query').val();

			// search articles containing search term in title
			this.listArticles({
				title__icontains: search
			});
		},

		/**
		 * filter articles
		 * @return {[type]} [description]
		 */
		filterArticles : function() {

			// data from filter form
			var data = {};

			//console.log('change');

			// category
			if ($("select[name=category]").val()) {
				data.category__id = $("select[name=category]").val();
			}

			// publish_from
			if ($("input[name=publish_from]").val()) {
				data.publish_from__gte = $("input[name=publish_from]").val();
			}

			// publish_to
			if ($("input[name=publish_to]").val()) {
				data.publish_to__lte = $("input[name=publish_to]").val();
			}

			// published
			if ($("select[name=published]").val()) {
				var published = $("select[name=published]").val();

				var today = new Date();
				today = today.getFullYear()+'-'+(today.getMonth()+1)+'-'+today.getDate();

				var yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				yesterday = yesterday.getFullYear()+'-'+(yesterday.getMonth()+1)+'-'+yesterday.getDate();

				var weekBefore = new Date();
				weekBefore.setDate(weekBefore.getDate() - 7);
				weekBefore = weekBefore.getFullYear()+'-'+(weekBefore.getMonth()+1)+'-'+weekBefore.getDate();

				var monthBefore = new Date();
				monthBefore.setDate(monthBefore.getDate() - 31);
				monthBefore = monthBefore.getFullYear()+'-'+(monthBefore.getMonth()+1)+'-'+monthBefore.getDate();

				switch (published) {
					case 'today' : data.publish_from__exact = today; break;
					case 'yesterday' : data.publish_from__exact = yesterday; break;
					case 'week' : {
						data.publish_from__gte = weekBefore;
						data.publish_from__lte = today;
					} break;
					case 'month' : {
						data.publish_from__gte = monthBefore;
						data.publish_from__lte = today;
					} break;
				}
			}

			// state
			if ($("select[name=state]").val()) {
				data.state = $("select[name=state]").val();
			}

			// author
			if ($("select[name=author]").val()) {
				data.authors__id = $("select[name=author]").val();
			}


			// show articles based on filter data
			this.listArticles(data);
		},

		/**
		 * show/hide filtering form
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.filter-articles click' : function(el, ev) {

			ev.preventDefault();

			// show/hide filtering form
			$('.filter-form').toggle();
		},

		/**
		 * destroy this control
		 * @return {[type]} [description]
		 */
		destroy: function() {
			can.Control.prototype.destroy.call( this );
		}
	})
);