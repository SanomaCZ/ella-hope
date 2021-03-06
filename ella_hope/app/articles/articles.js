steal(
	'./create-article.js'
	, './article.css'
	, window.HOPECFG.APP_ROOT + '/resources/js/bootstrap.min.js'
	, window.HOPECFG.APP_ROOT + '/resources/js/date.js'	// date parse
	, window.HOPECFG.APP_ROOT + '/resources/js/bootstrap-datepicker.js'	// datepicker js
	, window.HOPECFG.APP_ROOT + '//resources/css/bootstrap-datepicker.css'	// datepicker css
	, window.HOPECFG.APP_ROOT + '//resources/js/bootstrap-timepicker.js'	// timepicker js
	, window.HOPECFG.APP_ROOT + '//resources/css/bootstrap-timepicker.css'	// timepicker css
	, window.HOPECFG.APP_ROOT + '//resources/js/jquery.chosen.js'	// select list js
	, window.HOPECFG.APP_ROOT + '//resources/css/jquery.chosen.css'	// select list css
	, './list-filter.js'

).then(Articles = can.Control({
		defaults: {
			initView: window.HOPECFG.APP_ROOT + '//articles/views/init.ejs',
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

			self.modelClass = (self.options.model == 'articles' ? Article : self.options.model == 'galleries' ? Gallery : Filmstrip)

			// destroy articleCreate control if it was created
			// this is useful if we i.e. edit an article and without saving or canceling
			// we go to article list... timer etc. needs to be destroyed
			if (this.articleCreate) {
				this.articleCreate.destroy();
			}

			// render init view
			can.view(window.HOPECFG.APP_ROOT + '/articles/views/init.ejs', {
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
			this.filterControl = new ListFilter($("#filter"), {
				owner: self
				, model: self.modelClass
				, dateOptions: self.options.dateOptions
			});

			cb()
		},


		/**
		 * this route is called when we i.e. edit an articles and then click on Articles in menu
		 */
		':page route': function (data) {
			if (data.page == 'articles' || data.page == 'galleries' || data.page == 'filmstrips') {
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

				$("#load-state").show();

				if (data.page == 'articles' || data.page == 'galleries' || data.page == 'filmstrips') {
					self.modelClass.findOne({id: data.id}, function (article) {
						self.articleCreate = new ArticleCreate(self.element, {
							type: 'article',
							article: article,
							articleStates: self.options.articleStates,
							articleComments: self.options.articleComments,
							dateOptions: self.options.dateOptions,
							timeOptions: self.options.timeOptions,
							model: data.page
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

		'.preview-article click': function(el, ev) {
			ev.preventDefault();

			function getBaseUrl(url) {
				var parser = document.createElement('a');
				parser.href = url;
				return parser.protocol + '//' + parser.host + '/';
			}
			var url = getBaseUrl(BASE_URL) + 'preview/' + $(el).data('article').id + '/?user=' + USER.attr('user_id') + '&hash=' + USER.attr('api_key').substr(0, 8)
			window.open(url);
		},

		listItems: function (cb) {
			var self = this;

			$("#load-state").show();

			var data = self.filterControl.getVals();
			data.order_by = '-publish_from';
			data.limit = this.paginator.attr('limit');
			data.offset = this.paginator.attr('offset');

			var items = self.modelClass.findAll(data)

			can.view(window.HOPECFG.APP_ROOT + '/articles/views/list-articles.ejs', {
				articles: items
				, model: self.options.model
			}).then(function (frag) {
				$("#inner-content").html(frag);

				items.then(function (items) {
					if ('meta' in items) {
						var m = items.meta;
						var offset = Math.min((1+ m.offset), m.total_count);
						var limit = Math.min((m.offset + m.limit), m.total_count)
						$(".pagination .current a").html(
							offset + '-' + limit + ' / ' + m.total_count
						)
					}
				});

				if (cb) {
					cb();
				}

				$("#load-state").hide();
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
