steal(
	//'./css/search_result.css'
	window.HOPECFG.APP_ROOT + '/models/models.js'
	, './upload-photos.js'
	, './photos.css'
	, window.HOPECFG.APP_ROOT + '/resources/js/bootstrap.min.js'
	, window.HOPECFG.APP_ROOT + '/resources/js/date.js'	// date parse
	, window.HOPECFG.APP_ROOT + '/resources/js/bootstrap-datepicker.js'	// datepicker js
	, window.HOPECFG.APP_ROOT + '/resources/css/bootstrap-datepicker.css'	// datepicker css
	, window.HOPECFG.APP_ROOT + '/resources/js/bootstrap-timepicker.js'	// timepicker js
	, window.HOPECFG.APP_ROOT + '/resources/css/bootstrap-timepicker.css'	// timepicker css
	, window.HOPECFG.APP_ROOT + '/resources/js/jquery.chosen.js'	// select list js
	, window.HOPECFG.APP_ROOT + '/resources/css/jquery.chosen.css'	// select list css
	, window.HOPECFG.APP_ROOT + '/resources/js/jquery.cookie.js'
	, '../articles/list-filter.js'
).then(Photos = can.Control({
		defaults: {
			initView: window.HOPECFG.APP_ROOT + "/photos/views/init.ejs",
			dateOptions: {	// https://github.com/eternicode/bootstrap-datepicker
				format: 'yyyy-mm-dd',
				weekStart: 1,
				autoclose: true
			},
			timeOptions: {
				minuteStep: 1,
				showSeconds: false,
				showMeridian: false,
				defaultTime: false
			},
			model: 'photos'

		}
	}, { //prototype

		photosUpload: null,
		paginator: null,	// paginator
		filterControl: null,

		init: function (element, options) {

			var self = this;

			self.modelClass = Photo;

			// render init view
			can.view(this.options.initView, {}, function (html) {
				self.element.html(html);
				self.initFilter(function () {
					self.initPagination(function () {
						self.listItems();
					});
				});
			});
		},

		resetPaginator: function () {
			this.paginator.attr('offset', 0);
			this.paginator.attr('limit', 20);
		},

		':page route': function (data) {

			if (data.page == 'photos') {
				if (this.element && this.element.children().length) {
					this.init();
				}
			}
		},

		':page/:action route': function (data) {

			if (data.action == 'new-photos') {
				if (this.photosUpload) {
					this.photosUpload.destroy();
					this.photosUpload = null;
				}
				this.photosUpload = new PhotosUpload(this.element, {});
			}
		},

		':page/:action/:id route': function (data) {
			if (!data.id > 0) {
				return;
			}

			var self = this;
			if (data.action == 'edit') {
				Photo.findOne({id: data.id}, function (photo) {
					if (self.photosUpload) {
						self.photosUpload.destroy();
						self.photosUpload = null;
					}
					self.photosUpload = new PhotosUpload(self.element, {
						photo: photo
					});
				});
			}
		},

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

		'.pagination li a click': function (el, ev) {
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

		'.delete click': function (el, ev) {
			ev.preventDefault();

			if (confirm(el.data('confirm'))) {
				el.data('photo').destroy(function () {
					el.closest('tr').remove()
				});
			}
		},

		listItems: function (cb) {
			var self = this;
			$("#load-state").show();
			var data = self.filterControl.getVals();

			data.order_by = '-id';
			data.limit = this.paginator.attr('limit');
			data.offset = this.paginator.attr('offset');

			if (data.tag) {
				var items = self.modelClass.getByTag({tags: [data.tag]})
			} else {
				var items = self.modelClass.findAll(data)
			}

			can.view(window.HOPECFG.APP_ROOT + '/photos/views/list-photos.ejs', {
				photos: items
			}).then(function (frag) {
				$("#inner-content").html(frag);

				items.then(function(items) {
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

		initFilter: function (cb) {
			var self = this;
			this.filterControl = new ListFilter($("#filter"), {
				owner: self, model: self.modelClass, dateOptions: self.options.dateOptions
			});

			cb();
		},

		/**
		 * destructor, triggered automatically
		 */
		destroy: function () {
			if (this.photosUpload) {
				this.photosUpload.destroy();
			}

			can.Control.prototype.destroy.call(this);
		}

	})
	);
