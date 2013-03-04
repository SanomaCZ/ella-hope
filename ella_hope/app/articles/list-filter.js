steal(
	'//app/resources/js/jquery.chosen.js'
	, '//app/resources/css/jquery.chosen.css'

).then(ListFilter = can.Control({
		defaults: {
			order_by: '-id',
			model: null,
			owner: null
		}
	}, {
		init: function (el, options) {
			var self = this;

			this.resetting = false;
			this.vals = new can.Observe();
			this.vals.bind('change', function () {
				if (!this.resetting) {
					self.options.owner.listItems()
				}
			});

			this.element.find('.category-filter').ajaxChosen({
				type: 'GET',
				url: BASE_URL + '/category/?',
				jsonTermKey: 'title__icontains',
				dataType: 'json'
			}, function (data) {
				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.id, text: val.full_title });
				});

				return results;
			}, {
				"allow_single_deselect": true
			});

			this.element.find('.author-filter').ajaxChosen({
				type: 'GET',
				url: BASE_URL + '/author/?',
				jsonTermKey: 'name__icontains',
				dataType: 'json'
			}, function (data) {

				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.id, text: val.name });
				});

				return results;
			}, {
				"allow_single_deselect": true
			});

			this.element.find('.tag-filter').ajaxChosen({
				type: 'GET',
				url: BASE_URL + '/tag/?',
				jsonTermKey: 'name__icontains',
				dataType: 'json'
			}, function (data) {

				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.resource_uri, text: val.name });
				});

				return results;
			}, {
				"allow_single_deselect": true
			});

			$('.chzn-select').chosen({allow_single_deselect: true});

			this.element.find("input[name=publish_from], input[name=publish_to]")
				.datepicker(self.options.dateOptions)
				.on('change', function (ev) {
					self.updateItem($(this).attr('name'), this.value)
				});

			this.element.find("select").on('change', function (ev, el) {
				self.updateItem($(this).attr('name'), this.value)
			});
		},

		updateItem: function(name, value) {
			if (!value) {
				this.vals.removeAttr(name)
			} else {
				this.vals.attr(name, value);
			}
		},

		getVals: function () {
			return this.vals.attr()
		},

		'.list-filter submit': function (el, ev) {
			ev.preventDefault();
			this.options.owner.resetPaginator();
			return false;
		},

		'.toggle-advanced click': function (el, ev) {
			ev.preventDefault();
			$(el).toggleClass('dropup').toggleClass('dropdown')
			this.element.find('.filter-advanced').toggle();

			var old_val = $.cookie(window.HOPECFG.COOKIE_FILTER) || 'false';
			$.cookie(window.HOPECFG.COOKIE_FILTER, old_val == 'true' ? 'false' : 'true', {path: '/'});
		},

		'.reset-filter click': function (el, ev) {
			var self = this;
			ev.preventDefault();

			$('#filter').find('input, select').each(function () {
				$(this).val(null).trigger('liszt:updated');
			});

			self.resetting = true;
			self.vals.each(function(val, name) {
				if (Object.keys(self.vals).length == 1) {
					self.resetting = false;
				}
				self.vals.removeAttr(name);
			});
		}
	})
)
