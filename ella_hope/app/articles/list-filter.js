steal(
	window.HOPECFG.APP_ROOT + '/resources/js/jquery.chosen.js'
	, window.HOPECFG.APP_ROOT + '/resources/css/jquery.chosen.css'

).then(ListFilter = can.Control({
		defaults: {
			order_by: '-id'
			, model: null
			, owner: null
			, transformator: {
				title: 'title__icontains'
				, author: 'authors__id'
				, category: 'category__id'
				, publish_from: 'publish_from__gte'
				, publish_until: 'publish_from__lte'
				, published: function(value) {

					var isoDate = function (dateObj) {
						var yyyy = dateObj.getFullYear().toString();
						var mm = (dateObj.getMonth() + 1).toString();
						var dd = dateObj.getDate().toString();
						return yyyy + '-' + (mm[1] ? mm : "0" + mm[0]) + '-' + (dd[1] ? dd : "0" + dd[0]);
					  };

					var someDate = new Date();
					if (value == 'today') {
						return ['publish_from__exact', isoDate(someDate)];
					} else if (value == 'yesterday') {
						someDate.setDate(someDate.getDate() - 1)
						return ['publish_from__exact', isoDate(someDate)];
					} else if (value == 'week') {
						someDate.setDate(someDate.getDate() - 7);
						return ['publish_from__gte', isoDate(someDate)];
					} else if (value == 'month') {
						someDate.setDate(someDate.getDate() - 30);
						return ['publish_from__gte', isoDate(someDate)];
					} else {
						return ['publish_from', false];
					}
				}
			}
		}
	}, {
		init: function (el, options) {
			var self = this;

			this.resetting = false;
			this.vals = new can.Observe();
			this.vals.bind('change', function () {
				if (!self.resetting) {
					self.options.owner.listItems()
				}
			});

			this.element.find('.category-filter').ajaxChosen({
				type: 'GET',
				url: BASE_URL + '/category/?',
				jsonTermKey: 'title__icontains',
				dataType: 'json'
			}, function (data) {
				if ('meta' in data) {
					data = data.data;
				}
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
				if ('meta' in data) {
					data = data.data;
				}
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
				if ('meta' in data) {
					data = data.data;
				}

				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.resource_uri, text: val.name });
				});

				return results;
			}, {
				"allow_single_deselect": true
			});

			$('.chzn-select').chosen({allow_single_deselect: true});

			this.element.find("input[name=publish_from], input[name=publish_until]")
				.datepicker(self.options.dateOptions)
				.on('change', function (ev) {
					self.updateItem($(this).attr('name'), this.value)
				});

			this.element.find("select").on('change', function (ev, el) {
				self.updateItem($(this).attr('name'), this.value)
			});

			$(".filter-items").button();

		},

		updateItem: function (name, value) {
			var self = this;
			if (!name) {
				return;
			}

			if (name in this.options.transformator) {
				name = this.options.transformator[name];
				if (typeof name == 'function') {
					var ret = name(value);
					name = ret[0];
					value = ret[1];
				}
			}

			var baseResetName = name;
			if (name.indexOf('__') != -1) {
				baseResetName = name.substr(0, name.indexOf('__'))
			}

			var origResetting = self.resetting;
			self.resetting = true;
			self.vals.each(function (eachVal, eachName) {
				if (eachName === name) { // exact match, item will be affected anyway

				} else if (eachName.indexOf(baseResetName + '__') == 0) {
					//some filter with given name, but with extra stuff like __lte __gte __exact etc.
					self.vals.removeAttr(eachName);
				}
			})

			self.resetting = origResetting;

			if (!value) {
				this.vals.removeAttr(name)
			} else {
				this.vals.attr(name, value);
			}
		},

		getVals: function () {
			return this.vals.attr()
		},

		/**
		 * wrapper for resetting more items without triggering listing update
		 *
		 * @param worker - function to do items modification
		 */
		batchReset: function(worker) {
			var self = this;
			self.resetting = true;

			worker();

			self.resetting = false;
			self.options.owner.listItems(function () {
				$('.filter-items').button('reset')
			})
		},

		'.filter-items click': function (el, ev) {
			ev.preventDefault();
			var self = this;

			$(el).button('loading');

			self.batchReset(function() {
				self.element.find('input[type=text]').each(function () {
					self.updateItem($(this).attr('name'), $(this).val())
				});

				self.options.owner.resetPaginator();
			});

			return false;
		},

		'.toggle-advanced click': function (el, ev) {
			ev.preventDefault();
			$(el).toggleClass('dropup').toggleClass('dropdown');
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

			self.batchReset(function () {
				self.vals.each(function (val, name) {
					self.vals.removeAttr(name);
				});
			})
		}
	})
)
