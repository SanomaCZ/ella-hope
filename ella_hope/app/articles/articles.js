steal(
	'./create-article.js'
	, './article.css'
	, '//app/resources/js/bootstrap.min.js'
	, '//app/resources/js/date.js'	// date parse
	, '//app/resources/js/bootstrap-datepicker.js'	// datepicker js
	, '//app/resources/css/bootstrap-datepicker.css'	// datepicker css
	, '//app/resources/js/bootstrap-timepicker.js'	// timepicker js
	, '//app/resources/css/bootstrap-timepicker.css'	// timepicker css
	, '//app/resources/js/jquery.chosen.js'	// select list js
	, '//app/resources/css/jquery.chosen.css'	// select list css
	, './list-filter.js'

).then(Articles = can.Control({
		defaults: {
			initView: "//app/articles/views/init.ejs",
			articleStates: ["added", "ready", "approved", "published", "deleted"], // "postponed"
			articleComments: ["all", "registered", "nobody"],
			dateOptions: {	// https://github.com/eternicode/bootstrap-datepicker
				format: 'yyyy-mm-dd',
				weekStart: 1,
				autoclose: true
			}, timeOptions: {
				minuteStep: 1,
				showSeconds: false,
				showMeridian: false,
				defaultTime: false
			}, model: 'articles'
		}
	}, {
		articleCreate: null,
		paginator: null,
		filterControl: null,

		init: function (element, options) {
			var self = this;

			self.modelClass = (self.options.model == 'articles' ? Article : Gallery)

			// destroy articleCreate control if it was created
			// this is useful if we i.e. edit an article and without saving or canceling
			// we go to article list... timer etc. needs to be destroyed
			if (this.articleCreate) {
				this.articleCreate.destroy();
			}

			// render init view
			can.view('//app/articles/views/init.ejs', {
				states: this.options.articleStates,
				model: self.options.model
			}, function (html) {
				self.element.html(html);

				//FUUUUUUUUUUUU
				self.initFilter(function () {
					self.initPagination(function () {
						self.listItems();
					});
				});
			});
		},

		initFilter: function (cb) {
			var self = this;
			if (!this.filterControl) {
				this.filterControl = new ListFilter($("#filter"), {
					owner: self
					, model: self.modelClass
					, dateOptions: self.options.dateOptions
				});

				cb()
			}
		},


		/**
		 * this route is called when we i.e. edit an articles and then click on Articles in menu
		 */
		':page route': function (data) {
			if (data.page == 'articles' || data.page == 'galleries') {
				// if there are children, control needs to be initialized
				// it's because there was something else in the element and
				// we need to initialize it with current control
				if (this.element && this.element.children().length) {
					this.init();
				}
			}
		},

		':page/:action route': function (data) {
			if (data.action == 'new') {
				this.articleCreate = new ArticleCreate(this.element, this.options);
			}
		},

		':page/:action/:id route': function (data) {
			if (!data.id || !data.id > 0) {
				return;
			}

			var self = this;
			if (data.action == 'edit') {
				if (data.page === 'articles') {
					Article.findOne({id: data.id}, function (article) {
						self.articleCreate = new ArticleCreate(self.element, {
							type: 'article',
							article: article,
							articleStates: self.options.articleStates,
							articleComments: self.options.articleComments,
							dateOptions: self.options.dateOptions,
							timeOptions: self.options.timeOptions,
							model: 'articles'
						});
					});
				} else if (data.page === 'galleries') {
					Gallery.findOne({id: data.id}, function (article) {
						self.articleCreate = new ArticleCreate(self.element, {
							type: 'article',
							article: article,
							articleStates: self.options.articleStates,
							articleComments: self.options.articleComments,
							dateOptions: self.options.dateOptions,
							timeOptions: self.options.timeOptions,
							model: 'galleries'
						});
					});
				}
			} else if (data.action == 'edit-draft') {
				Draft.findOne({id: data.id}, function (draft) {
					self.articleCreate = new ArticleCreate(self.element, {
						type: 'draft',
						article: draft,
						articleStates: self.options.articleStates,
						articleComments: self.options.articleComments,
						dateOptions: self.options.dateOptions, timeOptions: self.options.timeOptions
					});
				});
			}
		},

		/**
		 * pagination for articles list
		 * @return {[type]} [description]
		 */
		initPagination: function (cb) {
			var self = this;

			this.paginator = new can.Observe({
				limit: 20,
				offset: 0
			});

			// when paginator attribute changes, reload articles list
			this.paginator.bind('change', function (ev, attr, how, newVal, oldVal) {
				self.listItems();
			});

			cb();
		},

		resetPaginator: function () {
			this.paginator.attr('offset', 0);
			this.paginator.attr('limit', 20);
		},

		/**
		 * pagination item is clicked - update paginator
		 */
		'.pagination-articles li a click': function (el, ev) {

			ev.preventDefault();

			var newOffset;

			if (el.hasClass('prev')) {
				newOffset = this.paginator.attr('offset') - this.paginator.attr('limit');
				if (newOffset < 0) {
					newOffset = 0;
				}
			}
			else if (el.hasClass('next')) {
				newOffset = this.paginator.attr('offset') + this.paginator.attr('limit');
			}
			this.paginator.attr('offset', newOffset);
		},

		/**
		 * delete article
		 */
		'.delete click': function (el, ev) {
			ev.preventDefault();
			if (confirm(el.data('confirm'))) {
				el.data('article').destroy(function () {
					el.closest('tr').remove()
				});
			}
		},

		listItems: function () {
			var self = this;
			var data = self.filterControl.getVals();
			data.order_by = '-publish_from';
			data.limit = this.paginator.attr('limit');
			data.offset = this.paginator.attr('offset');

			if (data.tag) {
				var articles = self.modelClass.getArticlesByTag([data.tag])
			} else {
				var articles = self.modelClass.findAll(data)
			}

			can.view('//app/articles/views/list-articles.ejs', {
				articles: articles
				, model: self.options.model
			}).then(function (frag) {
				$("#inner-content").html(frag);
			});
		},

		/**
		 * destructor, triggered automatically
		 */
		destroy: function () {
			// if this.articleCreate exist, call its destroy method
			if (this.articleCreate) {
				this.articleCreate.destroy();
			}

			can.Control.prototype.destroy.call(this);
		}
	})
	);
