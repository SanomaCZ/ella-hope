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

			this.vals = new can.Observe.List([]);
			this.vals.bind('change', function () {
				self.options.owner.listItems()
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
				.on('change', function () {

				});

			this.element.find("select").on('change', function (ev, el) {
				//TODO
				self.vals.attr(ev.target.name, el.selected);
			});
		},

		getVals: function () {
			console.log(this.vals.serialize());
			return this.vals.serialize()
		},

		filterArticlesByTag: function (data) {
			can.view('//app/articles/views/list-articles.ejs', {
				articles: Article.getArticlesByTag(data)
			}).then(function (frag) {
					$("#inner-content").html(frag);
				});
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

		'.filter-items click': function (el, ev) {
			ev.preventDefault();

			// get search term
			var search = el.siblings('input.search-query').val();

			if ($("select[name=category]").val()) {
				data.category__id = $("select[name=category]").val();
			}

			if ($("input[name=publish_from]").val()) {
				data.publish_from__gte = $("input[name=publish_from]").val();
			}

			if ($("input[name=publish_to]").val()) {
				data.publish_to__lte = $("input[name=publish_to]").val();
			}

			if ($("select[name=published]").val()) {
				var published = $("select[name=published]").val();

				var today = new Date();
				today = today.getFullYear() + '-' + (today.getMonth() + 1) + '-' + today.getDate();

				var yesterday = new Date();
				yesterday.setDate(yesterday.getDate() - 1);
				yesterday = yesterday.getFullYear() + '-' + (yesterday.getMonth() + 1) + '-' + yesterday.getDate();

				var weekBefore = new Date();
				weekBefore.setDate(weekBefore.getDate() - 7);
				weekBefore = weekBefore.getFullYear() + '-' + (weekBefore.getMonth() + 1) + '-' + weekBefore.getDate();

				var monthBefore = new Date();
				monthBefore.setDate(monthBefore.getDate() - 31);
				monthBefore = monthBefore.getFullYear() + '-' + (monthBefore.getMonth() + 1) + '-' + monthBefore.getDate();

				switch (published) {
					case 'today' :
						data.publish_from__exact = today;
						break;
					case 'yesterday' :
						data.publish_from__exact = yesterday;
						break;
					case 'week' :
					{
						data.publish_from__gte = weekBefore;
						data.publish_from__lte = today;
					}
						break;
					case 'month' :
					{
						data.publish_from__gte = monthBefore;
						data.publish_from__lte = today;
					}
						break;
				}
			}

			if ($("select[name=state]").val()) {
				data.state = $("select[name=state]").val();
			}

			if ($("select[name=author]").val()) {
				data.authors__id = $("select[name=author]").val();
			}

			// tag - must be different function call, filtering by tags is separate
			if ($("select[name=tag]").val()) {
				this.filterArticlesByTag([$("select[name=tag]").val()]);
				return false;
			}
		},

		'.reset-filter click': function (el, ev) {
			ev.preventDefault();

			$('.filter-form').find('input, select').each(function () {
				$(this).val(null).trigger('liszt:updated');
			})
		}
	})
	)
