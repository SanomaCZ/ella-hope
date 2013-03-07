steal(
	//'./css/search_result.css'
	'./upload-photos.js'
	, './photos.css'
	, '//app/resources/js/bootstrap.min.js'
	, '//app/resources/js/date.js'	// date parse
	, '//app/resources/js/bootstrap-datepicker.js'	// datepicker js
	, '//app/resources/css/bootstrap-datepicker.css'	// datepicker css
	, '//app/resources/js/bootstrap-timepicker.js'	// timepicker js
	, '//app/resources/css/bootstrap-timepicker.css'	// timepicker css
	, '//app/resources/js/jquery.chosen.js'	// select list js
	, '//app/resources/css/jquery.chosen.css'	// select list css
	, '//app/resources/js/jquery.cookie.js'
	, '../articles/list-filter.js'
).then(Photos = can.Control({
		defaults: {
			initView: "//app/photos/views/init.ejs",
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

			// render init view
			can.view(this.options.initView, {}, function (html) {
				self.element.html(html);
				self.initFilter();
				self.initPagination();
				self.listItems();
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

		initPagination: function () {
			var self = this;
			this.paginator = new can.Observe({
				limit: 20,
				offset: 0
			});

			// when paginator attribute changes, reload articles list
			this.paginator.bind('change', function (ev, attr, how, newVal, oldVal) {
				self.listItems();
			});
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

		listItems: function (data) {
			var self = this;
			data = data || self.filterControl.getVals();

			data.order_by = '-id';
			data.limit = this.paginator.attr('limit');
			data.offset = this.paginator.attr('offset');

			can.view('//app/photos/views/list-photos.ejs', {
				photos: Photo.findAll(data)
			}).then(function (frag) {
				$("#inner-content").html(frag);
			});
		},

		initFilter: function () {
			var self = this;
			if (!this.filterControl) {
				this.filterControl = new ListFilter($("#filter"), {
					owner: self, model: self.modelClass, dateOptions: self.options.dateOptions
				});
			}
		},

		/**
		 * destructor, triggered automatically
		 */
		destroy: function () {
			if (this.photosUpload) {
				this.photosUpload.destroy();
			}

			if (this.filterControl) {
				this.filterControl.destroy();
			}

			can.Control.prototype.destroy.call(this);
		}

	})
	);
