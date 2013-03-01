steal(
	'//app/resources/plugins/markitup/jquery.markitup.js'
	, '//app/resources/plugins/markitup/sets/markdown/set.js'
	, '//app/resources/plugins/markitup/skins/markitup/style.css'
	, '//app/resources/plugins/markitup/sets/markdown/style.css'
	, '//app/resources/js/slug.js'
	, '//app/resources/js/jquery-ui/jquery-ui-1.10.1.custom.min.js'
	, '//app/resources/css/jquery-ui/cupertino/jquery-ui-1.10.1.custom.min.css'
	, '//app/resources/js/ajax-chosen.js'	// https://github.com/meltingice/ajax-chosen
)
.then(

	ArticleCreate = can.Control(
	/* @static */
	{
		defaults: {
			autosaveInterval: 120 * 1000,	// how ofter is draft automatically saved
			markitupSettings: {
				previewParserPath:	'',
				onShiftEnter:		{keepDefault:false, openWith:'\n\n'},
				markupSet: [
					{name:'First Level Heading', key:'1', placeHolder:'Your title here...', closeWith:function(markItUp) { return miu.markdownTitle(markItUp, '='); } },
					{name:'Second Level Heading', key:'2', placeHolder:'Your title here...', closeWith:function(markItUp) { return miu.markdownTitle(markItUp, '-'); } },
					{name:'Heading 3', key:'3', openWith:'### ', placeHolder:'Your title here...' },
					{name:'Heading 4', key:'4', openWith:'#### ', placeHolder:'Your title here...' },
					{name:'Heading 5', key:'5', openWith:'##### ', placeHolder:'Your title here...' },
					{name:'Heading 6', key:'6', openWith:'###### ', placeHolder:'Your title here...' },
					{separator:'---------------' },
					{name:'Bold', key:'B', openWith:'**', closeWith:'**'},
					{name:'Italic', key:'I', openWith:'_', closeWith:'_'},
					{separator:'---------------' },
					{name:'Bulleted List', openWith:'- ' },
					{name:'Numeric List', openWith:function(markItUp) {
						return markItUp.line+'. ';
					}},
					{separator:'---------------' },
					//{name:'Picture', key:'P', replaceWith:'![[![Alternative text]!]]([![Url:!:http://]!] "[![Title]!]")'},
					{name:'Picture', key:'P', closeWith:function(markItUp) { return ArticleCreate.prototype.insertPhoto(); }},
					{name:'Link', key:'L', openWith:'[', closeWith:']([![Url:!:http://]!] "[![Title]!]")', placeHolder:'Your text to link here...' },
                    {name:'Wiki', key: 'W', closeWith: function (markItUp) { return ArticleCreate.prototype.insertWikiRef(markItUp.textarea); }, className: 'markItUpwikiRef'}
					, {name:'Gallery', key: 'G', closeWith: function (markItUp) {  return ArticleCreate.prototype.insertGalleryRef(markItUp.textarea); }, className: 'markItUpGalleryRef'}

					//{separator:'---------------'},
					//{name:'Quotes', openWith:'> '},
					//{name:'Code Block / Code', openWith:'(!(\t|!|`)!)', closeWith:'(!(`)!)'},
					//{separator:'---------------'},
					//{name:'Preview', call:'preview', className:"preview"},
					//{name:'Preview', key:'R', className:"preview", closeWith:function(markItUp) { return ArticleCreate.prototype.showPreview(); }},
					//{name:'Test', key:'1', placeHolder:'Your title here...', closeWith:function(markItUp) { return alert('ano'); } }
				]
			}
		}
	},
	/* @prototype */
	{
		article: null,			// current article
		draft: null,			// current draft object
		gallery: null,			// if current article is gallery
		previousDraftValues: null,	// use this for comparison of old and new draft values
		autosaveTimer: null,	// timer for autosave, we need this to stop timer
		listFilter: null,

		init: function() {

			// show draft or article
			if (this.options.type == 'draft') {
				this.draft = this.options.article;
				this.show(this.draft.data);
			}
			else {
				this.article = this.options.article;
				this.show(this.article);
			}

			// initialize autosave
			// this.initAutosave(this.options.autosaveInterval);
		},

		/**
		 * displays form for creating/updating article
		 * @param  {can.Model.Article} article If article is provided -> edit
		 * @return {[type]}         [description]
		 */
		show: function(article){

			var self = this;

			this.article = article;
			if (!this.article) {

				// we want to create a new article / gallery
				this.article = this.options.model === 'articles' ? new Article() : new Gallery();
				this.article.static = true;
			}

			// parse publishFrom date
			var publishFrom = Date.parse(this.article.publish_from);
			if (publishFrom) {
				this.article['publish_from_date'] = publishFrom.toString('yyyy-MM-dd');
				this.article['publish_from_time'] = publishFrom.toString('HH:mm');
			}

			// parse publishTo date
			var publishTo = Date.parse(this.article.publish_to);
			if (publishTo) {
				this.article['publish_to_date'] = publishTo.toString('yyyy-MM-dd');
				this.article['publish_to_time'] = publishTo.toString('HH:mm');
			}

			// listen to article photo change - display chosen photo or enable to choose new photo
			this.article.bind('photo', function(ev){

				var photo = self.article.photo;

				if (!photo) {
					$('.title-photo img').attr('src', '');
					//$('form.article').find('input[name=photo]').val('');
					$('.title-photo-empty').show();
					$('.title-photo').hide();
				} else {
					$('.title-photo img').attr('src', photo.public_url);
					//$('form.article').find('input[name=photo]').val(photo.resource_uri);
					$('.title-photo-empty').hide();
					$('.title-photo').show();
				}
			});

			// render article form
			can.view( '//app/articles/views/create-article.ejs', {
				article: this.article,
				drafts: Draft.findAll({limit: 0}),
				states: this.options.articleStates,
				comments: this.options.articleComments,
				//photos: Photo.findAll(),
				relatedArticles: this.article.id ? Article.getRelatedArticles(this.article.id) : [],
				listings: this.article.id ? Listing.getListingByArticle({articleId: this.article.id}) : [],
				galleryitem: this.article.id && self.options.model === 'galleries' ? GalleryItem.getRelated(this.article.id) : {},
				model: self.options.model
			} ).then(function( frag ){
				self.element.html(frag);

				// enable chosen select
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();
				$('.enable_comments').chosen({allow_single_deselect:true});

				// ajax autocomplete for category/listings
				$.each([$('#category'), $('.listing_category')], function () {
					this.ajaxChosen({
						type: 'GET',
						url: BASE_URL + '/category/?',
						jsonTermKey: 'title__icontains',
						dataType: 'json'
					}, function (data) {

						var results = [];

						$.each(data, function (i, val) {
							results.push({ value: val.resource_uri, text: val.full_title });
						});

						return results;
					});
				});

				// ajax autocomplete for author
				$('.authors-article').ajaxChosen({
					type: 'GET',
					url: BASE_URL+'/author/?',
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

				// ajax autocomplete for source
				$('.article-source').ajaxChosen({
					type: 'GET',
					url: BASE_URL+'/source/?',
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

				// ajax autocomplete for tags
				$.each([$('.article-tags'), $('.article-main-tag')], function () {
					this.ajaxChosen({
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

				});


				// enable markup in all textareas
				$("textarea").markItUp(self.options.markitupSettings);

				// enable datepicker for publishFrom and publishTo
					$(".js-datepicker-group").find(".datepicker-default").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						var inputName = $(this).attr('name');
						var isTo = /_to($|_)/;
						var isFrom = /_from($|_)/;
						var wrapper = $(this).closest('.js-datepicker-group');

						if (isTo.test(inputName) && $(this).val()){
							var toVal = $(this).val()
							var fromVal = wrapper.find('input[name*=_from_].datepicker-default').val()
						} else if (isFrom.test(inputName) && $(this).val()){
							var fromVal = $(this).val();
							var toVal = wrapper.find('input[name*=_to_].datepicker-default').val()
						} else {
							fromVal = toVal = 0;
						}

						if (toVal && fromVal > toVal) {
							wrapper.find('.help-inline').html($.t('fix chronology of items')).show();

						} else {
							wrapper.find('.help-inline').html("").hide();
						}
					});

				// enable datepicker for listing publishFrom and publishTo
				$("#listing_publish_from, #listing_publish_to").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						var from = $("#listing_publish_from").val(),
							to = $("#listing_publish_to").val();
						if (to && from > to){
							$('#listing-date-alert').show();
						} else {
							$('#listing-date-alert').hide();
						}
					});

				// enable timepicker for publishFrom and publishTo
				$(".timepicker-default").timepicker(self.options.timeOptions);

				// connected articles - enable drag&drop between two lists
				$( "#found-related-articles, #chosen-related-articles" ).sortable({
					connectWith: "#chosen-related-articles",
					// when new article is dropped to related articles
					receive: function(event, ui) {
						var el = $(ui.item[0]),
							receivedID = el.data('article-id'),
							articleID = self.article.id;
						// save new relation
						Article.addRelatedArticle(articleID, receivedID, function(data){
							// add resource_uri to an element so that it can be deleted
                            el.data('resource_id', data.id).append('<i class="icon-remove pull-right remove-related"></i>');
						});
					}
				}).disableSelection();

					if (self.options.model === 'galleries') {

						// gallery - gallery items - enable drag&drop between two lists
						$("#found-recent-photos, #chosen-recent-photos").sortable({
							connectWith: "#chosen-recent-photos",
							// when new article is dropped to related articles
							receive: function (event, ui) {
								if (!self.article.id) {
									self.save(function() {
										self.receiveGalleryItem(ui)
									})
								} else {
									self.receiveGalleryItem(ui)
								}
							},
							update: function (event, ui) {
								self.setGallerySaveTimeout();
							}
						}).disableSelection();

						if (!self.article.id) {
							$("#found-recent-photos, #chosen-recent-photos").sortable("disable");

							self.article.bind('id', function (ev, newVal, oldVal) {
								if (newVal > 0) {
									$("#found-recent-photos, #chosen-recent-photos").sortable("enable");
									$(".unsaved-article").hide();
								}
							})
						}
					}

				// here we check for user privileges
				// users have different roles and they can edit different form fields
				// some fields are disabled for some roles, some fields are read-only
				// privileged are save after user logs in and are stored on localStorage
				$.each(USER.auth_tree.articles.article.fields, function(name, value){
					if (value._data) {
						if (value._data.readonly === true) {
							// if element's type is select, there is no attribute readonly
							// for these kind of elements we need to use disabled
							// elements won't be sent to the server, but it does not matter
							$el = $('.'+name);
							if ($el.is('select')) {
								$el.attr('disabled', true);
								// let chosen select know that there was a change
								$el.trigger("liszt:updated");
							}
							else {
								$el.attr('readonly', true);
							}
						}
						if (value._data.disabled === true) {
							$('.'+name).parent('.row').remove();
						}
					}
				});
			});

			this.element.slideDown(200);
		},

		receiveGalleryItem: function (ui) {
			var self = this;
			var el = $(ui.item[0]),
				receivedID = el.data('photo-id'),
				articleID = self.article.resource_uri;

			// save new relation
			var item = new GalleryItem({
				gallery: articleID,
				photo: receivedID,
				title: el.find('.photo-title').data('label'),
				text: el.find('.photo-description').data('label'),
				order: 0
			});

			item.save(function (model) {
				//jQuery UI's sortable serialize() returns value via attr()
				// so make it reachable via attr() [.data() isn't]
				el.attr('data-resource_id', model.id);
				el.data('order', item.order);
				self.setGallerySaveTimeout();
			});
		},

		/**
		 * detect a change in any form input
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'form.article change': function(el, ev) {

			var target = $(ev.target),
				name = $(ev.target).attr('name');
		},

		/**
		 * initialize autosave timer
		 * @param  {[type]} interval [description]
		 * @return {[type]}          [description]
		 */
		initAutosave: function(interval) {

			var self = this;

			//if (this.autosaveTimer) this.stopAutosave();
			this.autosaveTimer = setInterval(function(){
				self.save();
			}, interval);
		},

		setGallerySaveTimeout: function(interval) {
			if (this.options.model != 'galleries' || !this.article) { return; }
			var self = this;

			this.stopGalleryAutosave();

			if (interval === 0) {
				self.setGalleryOrder($("#chosen-recent-photos"));
			} else {
				this.saveGalleryTimeout = setTimeout(function () {
					self.setGalleryOrder($("#chosen-recent-photos"));
				}, interval || 30 * 1000);
			}
		},

		stopGalleryAutosave: function() {
			clearTimeout(this.saveGalleryTimeout);
			this.saveGalleryTimeout = null;
		},

		/**
		 * stop autosave timer
		 * @return {[type]} [description]
		 */
		stopAutosave: function() {
			clearInterval(this.autosaveTimer);
			this.autosaveTimer = null;
		},

		//TODO - optimise (set each order * 2 to allow injecting items to empty spaces
		// w/o need to reorder the whole set
		setGalleryOrder: function (sortable) {
			if (!sortable) { return; }
			//don't trust in natural elements order, let jQuery serialize their order
			var itemsOrder = sortable.sortable('toArray', { 'attribute': 'data-resource_id'});//.reverse();
			var current;

			for (var one in itemsOrder) {
				current = sortable.find('li[data-resource_id=' + itemsOrder[one] + ']');
				if ($(current).data('order') * 1 != one) {
					$(current).data('order', one);

					try {
						GalleryItem.update($(current).data('resource_id'), {order: one});
					} catch (e) {
						return;
					}
				}
			}
		},

		/**
		 * (auto)saves an article as a draft or as an article, if all required fields
		 * are filled correctly
		 * @return {[type]} [description]
		 */
		save: function(cb) {

			var autosaveLink = $('a.autosave'),
				buttonNormalText = autosaveLink.data('normal'),
				buttonSavingText = autosaveLink.data('saving'),
				buttonNormalCss = 'btn-info',
				buttonSavingCss = 'btn-warning';

			// set different text and class on button while saving
			autosaveLink
				.removeClass(buttonNormalCss)
				.addClass(buttonSavingCss)
				.html(buttonSavingText);

			// return button to normal state after a while
			setTimeout(function(){
				// restore text and class on button while saving
				autosaveLink
					.removeClass(buttonSavingCss)
					.addClass(buttonNormalCss)
					.html(buttonNormalText);
			}, 2000);

			// try to save the article and handle errors if there are any
			var errors = this.createArticle(cb);

			if (errors === true) {
				// there are no errors
				this.deleteDraft();
			}
			else {
				// there are some errors, save article as a draft and send errors back
				this.saveDraft();
			}
			return errors;
		},

		/**
		 * create article model from form values
		 * @return {[type]} [description]
		 */
		createArticle: function(cb) {
			var self = this,
				form = $('form.article'),
				values = form.serialize();
			values = can.deparam(values);

			values['announced'] = false;

			// merge date and time of publish_from
			values['publish_from'] = null;
			if (values['publish_from_date']) {
				values['publish_from'] = values['publish_from_date']+'T'+values['publish_from_time']; //"2012-08-07T09:47:44";
			}

			// merge date and time of publish_to
			values['publish_to'] = null;
			if (values['publish_to_date']) {
				values['publish_to'] = values['publish_to_date']+'T'+values['publish_to_time'];
			}

			values['published'] = (values['state'] == 'published');

			values['static'] = Boolean(values['static']);

			// if authors is not present, set to null so we can validate it
			if (!values['authors']) values['authors'] = null;

			if (values['photo'] === "") values['photo'] = null;

			if (values['source'] === "") {
				delete values['source'];
			}

			// if main_tag was selected, add it as object into tags attribute
			// then delete main_tag
			if (values.main_tag) {
				if (typeof values.tags === 'undefined') {
					values.tags = []
				}

				values.tags[values.tags.length] = {
					resource_uri: values.main_tag,
					'main_tag': true
				}
				delete values.main_tag;
			}

			values['app_data'] = {'ella':
				{'without_photo': Boolean(values['without_photo'])}
			}

			// when setting new article values in the next step,
			// we need to pass true as a second parameter
			// it means that we can remove (delete) previously added attributes
			// id would be deleted too and new article would be created
			// wherefore we need to maintain article id
			if (this.article.id) {
				values['id'] = this.article.id;
			}

			// update article's values
			this.article.attr(values, true);

			// remove all error markup
			form.find('.control-group').removeClass('error');
			form.find('.help-inline').empty();

			// check for errors (validation)
			var errors = this.article.errors();
			if (errors !== null) {
				return errors;
			}

			var success = true;
			this.article.save(function () {

				if (cb) {
					cb()
				}

				var foreignKeys = $("form.article").find('.js-removable-item');
				$.each(foreignKeys, function () {
					var model = $(this).data('model');
					success = success && self['save_' + model](this);
				});

			}, function (xhr) {
				alert('Error occured, try again later.');
				return false;
			});
			return true;
		},

		/**
		 * highlight inputs with error
		 * @param  {[type]} errors [description]
		 * @return {[type]}        [description]
		 */
		showErrors: function(instance, nested_block) {
			var input_prefix = nested_block ? (instance.prefix + "_"): "";
			var errors = instance.errors();

			if (errors) {
				$.each(errors, function (e) {
					$('.' + input_prefix + e, nested_block).closest('.control-group')
						.addClass('error')
						.find('.help-inline').html(errors[e][0]);
				});

				// scroll to first error
				$('html, body').animate({
					scrollTop: $('.control-group.error').eq(0).offset().top - 50
				}, 500);
			}
		},

		/**
		 * save listing - side category for article
		 * it is saved as relation between article and category, also with publish_from
		 * https://github.com/SanomaCZ/ella-hub/blob/master/doc/api.rst#listing
		 * @param {array} values - object w/ values for article
		 */
		save_listing: function(wrapper) {
			var listingAttrs = {
				publishable: this.article.resource_uri
				, category: $(wrapper).find('select[name=listing_category]').val()
				, commercial: $(wrapper).find('input[name=listing_commercial]').is(':checked')
			};

			var id = $(wrapper).find('input[name=listing_id]').val()
			if (id) {
				listingAttrs['id'] = id;
			}

			var from_date = $(wrapper).find('input[name=listing_publish_from_date]').val();
			var from_time = $(wrapper).find('input[name=listing_publish_from_time]').val();

			if (from_date && from_time) {
				listingAttrs.publish_from = from_date + 'T' + from_time;
			} else {
				listingAttrs.publish_from = null
			}

			var to_date = $(wrapper).find('input[name=listing_publish_to_date]').val();
			var to_time = $(wrapper).find('input[name=listing_publish_to_time]').val();

			if (to_date && to_time) {
				listingAttrs.publish_to = to_date + 'T' + to_time;
			}

			var listing = new Listing(listingAttrs);
			if (listing.errors()) {
				this.showErrors(listing, wrapper);
				return false;
			}

			listing.save(function(instance) {
				$(wrapper).find('input[name=listing_id]').val(instance.id);
			});
			return true;
		},

		/**
		 * save the article as a draft or saves article (with timer or autosave button)
		 * @param  {[type]} el [description]
		 * @return {[type]}    [description]
		 */
		saveDraft : function(el) {

			var self = this,
				form = this.element.find('form.article');
				values = form.serialize();

			values = can.deparam(values);

			// first autosave - previousDraftValues is null so there is nothing to compare
			if (this.previousDraftValues !== null) {
				// if current and previous values are equal, do not update the draft
				// it would be better to properly compare two objects, but in this case
				// it's enough to compare stringified values
				if (JSON.stringify(values) == JSON.stringify(this.previousDraftValues)) {
					// values are the same - there is no update
					return;
				}
			}

			this.previousDraftValues = values;

			// this is how draft should look like
			var obj = {
				//"user": "/admin-api/user/6/",
				"content_type": this.options.model === 'articles' ? 'article' : 'gallery',
				"data" : values
			};

			// create new draft if draft is being saved for the first time
			if (!this.draft) {
				this.draft = new Draft();
			}

			// get draft id
			var id;
			if (this.draft) {
				id = this.draft.id;
			}

			// set current form values to the draft model
			this.draft.attr(obj, true);

			if (id) {
				this.draft.attr('id', id);
			}

			// create/update draft
			this.draft.save();
		},

		/**
		 * if there is automaticaly saved draft, delete it
		 * @return {[type]} [description]
		 */
		deleteDraft: function() {

			if (this.draft) {
				this.draft.destroy();
				this.draft = null;
			}
		},

		'.article-save click' : function(el, ev){

			ev.preventDefault();

			ev.stopPropagation();

			var errors = this.save();

			if (errors === true) {
				this.setGallerySaveTimeout(0);

				// stop autosave when leaving article
				this.stopAutosave();

				// redirect to list
				if (!$(el).data('stay')) {
					var page = this.options.model === 'articles' ? 'articles' : 'galleries';
					can.route.attr({page: page}, true);
				}
			}
			else {
				this.showErrors(this.article);
			}
		},
		'.autosave click' : function(el, ev) {
			this.save();
		},

		'.preview click' : function(el, ev) {
			this.setGallerySaveTimeout(0);
			this.showPreview();
		},

		'.cancel click' : function(el, ev){
			this.stopAutosave();

			this.deleteDraft();

			var page = this.options.model === 'articles' ? 'articles' : 'galleries';
			can.route.attr({page: page}, true);
		},

		/**
		 * generates slug from title
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.slug-from-title click' : function(el, ev) {

			ev.preventDefault();

			var title = $('.article').find($('input[name=title]')).val();
			$('#slug').val(slug(title));
		},

		/**
		 * gallery inherits from article
		 * it allows to save galleryitem along with an article
		 * https://github.com/SanomaCZ/ella-hub/blob/master/doc/api.rst#galleryitem
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.gallery click' : function(el, ev) {

			ev.preventDefault();

			$('#gallery-items').slideDown(200);
		},

		/**
		 * encyclopedia is special type of article
		 * set category, date_puclished and published automatically
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.encyclopedia click' : function(el, ev) {

			ev.preventDefault();

			// set category to Encyclopedia
			Category.getEncyclopediaCategory({}, function(cat){
				$('select[name=category]')
					.val(cat[0].resource_uri)
					.trigger('liszt:updated');	// update chosen select
			});

			// set historical publish date
			$('input[name=publish_from_date]').val('2000-01-01');
		},

		/**
		 * prefill article form with draft/template values
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'select[name=drafts] change': function(el, ev) {
			var $selected = $(el.find('option:selected')),
				draft = $selected.data('article'),
				label = $selected.data('label'),
				urlDelete = $selected.data('url-delete');

			el.siblings('.selected-draft')
				.append(label)
				.append('<a href="'+urlDelete+'">x</a>');
		},

		/**
		 * if listing (side category) is selected, show listing's optional fields
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'select[name=listing] change': function(el, ev) {

			if (el.val()) {
				$('#listing-options').slideDown(200);
			}
			else {

				var id = el.data('id');

				// if there is saved listing to the article, delete it
				if (id) {
					el.removeAttr('data-id');
					Listing.destroy(id);
				}

				$('#listing-options').slideUp(200);
			}
		},

		/**
		 * show drafts and templates
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.draft-select click' : function(el, ev) {

			// disable default click event
			ev.preventDefault();

			// stop autosave, maybe there will be a redirect
			this.stopAutosave();

			// show dialog
			$('#draft-modal').modal('show');
		},

		/**
		 * hide modal dialog before editing
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#draft-modal .edit-draft click' : function(el, ev) {
			$('#draft-modal').modal('hide');
		},

		/**
		 * open a dialog where new author can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-author-articles click' : function(el, ev) {

			ev.preventDefault();
			$('.author-modal-articles').modal('show');
		},

		/**
		 * generate slug from author name
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.author-modal-articles .slug-from-name click' : function(el, ev) {

			ev.preventDefault();

			var name = el.siblings('input[name=name]').val();
			el.siblings('input[name=slug]').val(slug(name));
		},

		/**
		 * create new author and insert it into author's select
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.author-modal-articles .insert-author click' : function(el, ev) {

			ev.preventDefault();

			// form values
			var values = $('.author-modal-articles').find('form').serialize();
			values = can.deparam(values);

			// create new author
			var author = new Author();
			author.attr(values);
			author.save(function(data){
				$('.authors-article')
					// append new author to authors list and make it selected
					.append('<option value="'+data.resource_uri+'" selected="selected">'+data.name+'</option>')
					// update chosen select
					.trigger('liszt:updated')
					;
			});

			$('.author-modal-articles').modal('hide');
		},

		/**
		 * open a dialog where new source can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-source click' : function(el, ev) {

			ev.preventDefault();

			// get target element where new source should be inserted
			var target = el.data('target');

			// save target to insert-source button so that
			// we can get it when button is clicked
			$('.source-modal-articles .insert-source').data('target', target);

			// open dialog
			$('.source-modal-articles').modal('show');
		},

		/**
		 * create new source and insert it into source's select
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.source-modal-articles .insert-source click' : function(el, ev) {

			ev.preventDefault();

			// target input where new tag should be inserted
			var target = el.data('target'),
				targetEl = $('.'+target);

			// form values
			var values = $('.source-modal-articles').find('form').serialize();
			values = can.deparam(values);

			// create new source
			var source = new Source();
			source.attr(values);
			source.save(function(data){
				targetEl
					// append new source to sources list and make it selected
					.append('<option value="'+data.resource_uri+'" selected="selected">'+data.name+'</option>')
					// update chosen select
					.trigger('liszt:updated')
					;
			});

			$('.source-modal-articles').modal('hide');
		},

		/**
		 * open a dialog where new tag can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-tag-articles click' : function(el, ev) {

			ev.preventDefault();

			// get target element where new tag should be inserted
			var target = el.data('target');

			// save target to insert-tag button so that
			// we can get it when button is clicked
			$('.tag-modal-articles .insert-tag').data('target', target);

			// open dialog
			$('.tag-modal-articles').modal('show');
		},

		/**
		 * generate slug from tag name
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.tag-modal-articles .slug-from-name click' : function(el, ev) {

			ev.preventDefault();

			var name = el.siblings('input[name=name]').val();
			el.siblings('input[name=slug]').val(slug(name));
		},

		/**
		 * create new tag and insert it into tag's select
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.tag-modal-articles .insert-tag click' : function(el, ev) {

			ev.preventDefault();

			// target input where new tag should be inserted
			var target = el.data('target'),
				targetEl = $('.'+target);

			// form values
			var values = $('.tag-modal-articles').find('form').serialize();
			values = can.deparam(values);

			// create new tag
			var tag = new Tag();
			tag.attr(values);
			tag.save(function(data){
				targetEl
					// append new tag to tags list and make it selected
					.append('<option value="'+data.resource_uri+'" selected="selected">'+data.name+'</option>')
					// update chosen select
					.trigger('liszt:updated')
					;
			});

			$('.tag-modal-articles').modal('hide');
		},

		/**
		 * open a dialog where title photo can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-photo click' : function(el, ev) {

			ev.preventDefault();

			// render list where title photo can be picked
			this.renderPhotosList({title: true});

			// show modal dialog
			$('#photos-modal').modal('show');
		},

		/**
		 * inserts title photo into an article
		 * @param  {[type]} photo [description]
		 * @return {[type]}       [description]
		 */
		insertTitlePhoto: function(photo) {
			this.article.attr('photo', photo);
			$('form.article').find('input[name=photo]').val(photo.resource_uri);
		},

		'.remove-photo click': function(el, ev) {
			ev.preventDefault();
			this.article.attr('photo', null);
			$('form.article').find('input[name=photo]').val('');
		},

		/**
		 * when user clicks on table row (radio, image), check the radio button on that row
		 * show form with additional parameter
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#photos-modal tr .pick click':function(el, ev) {
			$(el).parents('tr').find('input').attr('checked', 'checked');
			// hide previously showed form params
			$('.snippet-params').slideUp(200);
			// show current form params
			$(el).parents('tr').find('.snippet-params').slideDown(500);
		},

		/**
		 * hide dialog when user picks the photo and insert it into article
		 * photo is inserted as python snippet with required and optional attributes
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#photos-modal .insert-photo click':function(el, ev) {
			var now = new Date().getTime();
			if (!el.data('progress')) {
				el.data('progress', now);
			}

			ev.preventDefault();

			// get checked radio button, it's tr parent and photo from data attribute
			var tr = $('input[name=photo]:checked', '#photos-modal').parents('tr'),
				photo = tr.data('photo'),
				data = tr.data('data'),
				params = tr.find('.snippet-params'),
				format = can.deparam(params.serialize());

			// insert title photo
			if (data && data.title) {
				this.insertTitlePhoto(photo);
				$('#photos-modal').modal('hide');
			}
			else if (photo) {
				var snippet = this.generateSnippet('photos.photo', photo, format);

				$('#photos-modal').modal('hide');

				// insert snippet into textarea
				if (now == el.data('progress')) {
					$.markItUp( { replaceWith: snippet } );
				}
			}

			setTimeout(function() {
				el.data('progress', false);
			}, 500);
		},

		/**
		 * hide dialog
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#photos-modal .close-photo click':function(el, ev) {
			ev.preventDefault();
			$('#photos-modal').modal('hide');
		},


		'.set-date-now click': function(el, ev){
			ev.preventDefault();
			this.setDate(el);
		},

		'.related-name keyup': function(el, ev) {
			if (ev.keyCode == 13) {
				ev.preventDefault();
				can.trigger($(el).siblings('.related-name-action'), 'click');
				return false;
			}
		},

		/**
		 * set today's date to given input
		 * input is set in element's data-target-date
		 * @param {object} el - element which is operated on
	 	 */
		setDate: function(el) {
			var target = el.data('target-date'),
				date = new Date(),
				year = date.getUTCFullYear(),
				month = date.getMonth()+1,
				day = date.getDate(),
				fullDate = year+'-'+month+'-'+day;
			$('input[name='+target+']').val(fullDate);
		},

		'.set-time-now click': function(el, ev){
			ev.preventDefault();
			this.setTime(el);
		},

		/**
		 * set today's time to given input
		 * input is set in element's data-target-time
		 * @param {object} el - element which is operated on
		 */
		setTime: function(el){
			var target = el.data('target-time'),
				date = new Date(),
				hours = date.getHours(),
				minutes = date.getMinutes() < 10 ? '0'+date.getMinutes() : date.getMinutes(),
				fullTime = hours+':'+minutes;
			$('input[name='+target+']').val(fullTime);
		},

		'.set-datetime-now click': function(el, ev){
			ev.preventDefault();
			this.setDate(el);
			this.setTime(el);
		},

		/**
		 * generates snippet
		 * @param  {string} type   snippet type, i.e. photos.photo
		 * @param  {object} object current object, i.e. photo
		 * @param  {object} format additional params
		 * @return {string}        generated snippet
		 */
		generateSnippet: function(contentType, object, params) {
			if (contentType == 'ella_wikipages.wikipage') {
				var snippetData = [
					'{% box inline_reference for ' + contentType + ' with slug "' + params.slug + '" %}',
					'title:' + params.item_title,
					'{% endbox %}'
				]
			} else if (contentType == 'ella_galleries.gallery') {
				var snippetData = [
					'{% box inline for ' + contentType + ' with pk ' + params.id + ' %}',
					'title:' + params.item_title,
					'{% endbox %}'
				]
			} else if (contentType == 'photos.photo') {
				var snippetData = [
					"{% box inline_" + params.size + "_" + params.format + " for " + contentType + " with pk " + object.id + " %}",
					params.align === 'none' ? "" : "align:"+params.align,
					'show_title:' + (params.title ? 1 : 0),
					'show_description:' + (params.description ? 1 : 0),
					'show_authors:' + (params.authors ? 1 : 0),
					'show_source:' + (params.source ? 1 : 0),
					'show_detail:' + (params.detail ? 1 : 0),
					"{% endbox %}"
					]
			} else {
				alert('invalid widget type: ' + contentType);
			}

			return snippetData.join('\n').replace(/\n\n/g, "\n");
		},

		/**
		 * opens dialog where user can choose picture and insert it into an article
		 * @return {[type]} [description]
		 */
		insertPhoto: function() {

			// render photos list
			this.renderPhotosList({title: false});

			// show modal dialog
			$('#photos-modal').modal('show');
		},

		insertWikiRef: function (el, snippetInfo) {
			snippetInfo = snippetInfo || {
				snippetPosition: {
					start: $(el).getCursorPosition()
					, end: $(el).getCursorPosition()
				}
			}

			var renderForm = can.view.render('//app/articles/views/snippet-wikipage.ejs', {
				data: snippetInfo
			});

			var boxSnippet = $(el).closest('.js-textrea-box').find('.box-snippet');

			boxSnippet
				.empty()
				.append(renderForm)
				.find(".wikiref-name").ajaxChosen({
					type: 'GET',
					url: BASE_URL + '/wikipage/?',
					jsonTermKey: 'title__icontains',
					dataType: 'json'
				}, function (data) {
					var results = [];

					$.each(data, function (i, val) {
						results.push({ value: val.slug, text: val.title });
					});

					return results;
				});
		},

		insertGalleryRef: function (el, snippetInfo) {
			snippetInfo = snippetInfo || {
				snippetPosition: {
					start: $(el).getCursorPosition()
					, end: $(el).getCursorPosition()
				}
			}

			var renderForm = can.view.render('//app/articles/views/snippet-gallery.ejs', {
				data: snippetInfo
			});

			var boxSnippet = $(el).closest('.js-textrea-box').find('.box-snippet');

			boxSnippet
				.empty()
				.append(renderForm)
				.find(".item-name").ajaxChosen({
					type: 'GET',
					url: BASE_URL + '/gallery/?',
					jsonTermKey: 'title__icontains',
					dataType: 'json'
				}, function (data) {
					var results = [];

					$.each(data, function (i, val) {
						results.push({ value: val.id, text: val.title });
					});

					return results;
				});
		},

		/**
		 * render photos in dialog so that user can choose photo
		 * @return {[type]} [description]
		 */
		renderPhotosList: function(data) {
            data = data || {};

			// render list
			can.view( '//app/articles/views/list-photos.ejs', {
				photos: Photo.findAll({}),//TODO this.listFilter.getVals()),
				data: data
			} ).then(function( frag ){
				$('#photos-modal .photos-list').html(frag);
			});
		},

		/**
		 * allow user to upload new photos
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#photos-modal .new-photo click' : function(el, ev) {

			var self = this;

			// hide list of photosf
			var photosTable = el.closest('.modal-body').find('table');
			photosTable.hide();

			// append new div and create PhotosUpload control in it
			el.closest('.modal-body').append('<div class="upload"></div>');
			var photosUpload = el.closest('.modal-body').find('.upload');
			var photosUploadControl = new PhotosUpload(photosUpload, {});

			// when photos are uploaded, dostroy PhotosUpload and restore photos list
			photosUpload.on('photos-uploaded', function(ev){

				// update photos list
				self.renderPhotosList();

				// remove upload form
				photosUpload.remove();

				// show list of photos
				photosTable.show();
			});
		},

        /**
         * pagination item is clicked - update paginator
         * @param  {[type]} el [description]
         * @param  {[type]} ev [description]
         * @return {[type]}    [description]
         */
        '.pagination-photos li a click': function(el, ev) {

			ev.preventDefault();

			var newOffset;

			if (el.hasClass('prev')) {
				newOffset = this.photoPaginator.attr('offset') - this.photoPaginator.attr('limit');
				if (newOffset < 0) {
					newOffset = 0;
				}
			}
			else if (el.hasClass('next')) {
				newOffset = this.photoPaginator.attr('offset') + this.photoPaginator.attr('limit');
			}
			this.photoPaginator.attr('offset', newOffset);
        },

		/**
		 * find related articles based on currently selected tags
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.get-related-articles click': function(el, ev) {

			ev.preventDefault();

			// selected tags
			var tags = $('.article .article-tags').val();
			if (!tags) {
                alert($.t("Related articles are being found by tags, however current article has no tags assigned."));
				return;
			}
			Article.getArticlesByTag(tags, function(data){
				$.each(data, function(i, article){
					$('#found-related-articles').append('<li data-article-id="'+article.id+'">'+article.title+'</li>');
				});
			});
		},

		/**
		 * find articles by name se that they can be added as related articles
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.related-name-action.articles-action click': function(el, ev) {
			ev.preventDefault();

			// name that should be searched
			var search = el.siblings('input[name=related-name]').val();

			// search in title
			var data = "title__icontains=" + search;

			Article.findAll(data, function(articles){
				// empty list with articles if there are any
				$('#found-related-articles').empty();

				$.each(articles, function(i, article){
					$('#found-related-articles').append('<li data-article-id="'+article.id+'">'+article.title+'</li>');
				});
			});
		},

		/**
		 * remove related article
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.remove-related click' : function(el, ev) {

			Article.deleteRelatedArticle(el.parent().data('resource_id'), function(data) {
				el.parent().fadeOut().remove();
			});
		},

		/**
		 * find recent photos
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.get-recent-photos click': function(el, ev) {

			ev.preventDefault();

			var self = this;

			// TODO find all photos
			Photo.findAll({}, function(photos){
				self.renderRecentPhotos(photos);
			});
		},

		/**
		 * find photos by name se that they can be added to gallery
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.related-name-action.photos-action click': function(el, ev) {

			var self = this;

			ev.preventDefault();

			// name that should be searched
			var search = el.siblings('input[name=related-name]').val();

			// search in title
			var data = "title__icontains=" + search;

			Photo.findAll(data, function(photos){
				self.renderRecentPhotos(photos);
			});
		},

		/**
		 * render found photos, which can be added as galleryitem
		 * @param  {[type]} photos [description]
		 * @return {[type]}        [description]
		 */
		renderRecentPhotos: function(photos) {

			// empty list with photos if there are any
			var el = $('#found-recent-photos');
			el.empty();

			$.each(photos, function(i, photo){
				el.append(can.view.render('//app/articles/views/inline-gallery-item.ejs', {
					photo: photo
				}));
			});
		},

		/**
		 * remove connected photo in gallery
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.remove-recent-photo click' : function(el, ev) {

			GalleryItem.destroy(el.parent().data('resource_id'));
			el.parent().fadeOut().remove();
		},

		/**
		 * change galleryItem title
		 * @param el galleryItem element encapsulated in jQuery
		 * @param ev occured event
		 */
		'#chosen-recent-photos .change-galleryitem-label click': function (el, ev) {
			var parent = el.parent('div');
			var curr_title = parent.data('label');
			var title = prompt($.t("Enter photo's label"), curr_title);

			if (title !== null && title != curr_title) {
				parent.find('span.value')[0].innerHTML = title;
				parent.data('label', title);
				update_attrs = {};
				update_attrs[parent.data('attr')] = title;
				GalleryItem.update(parent.parent('li').data('resource_id'), update_attrs);
			}
		},

		/**
		 * find snippets in textarea so that images etc. can be handled comfortably
		 *
		 * snippet example:
		 * {% box inline_standard_ctverec for photos.photo with pk 3 %}
		 *	...
		 * {% endbox %}
		 *
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'textarea click' : function(el, ev) {
			var self = this;

			var snippetBox = $(el).closest('.js-textrea-box').find('.box-snippet');
			snippetBox.empty();

			// get current cursor position
			var position = el.getCursorPosition();

			// current text in textarea
			var str = el.val();

			// get all positions where any snippet starts
			var regexStart = /\{% box/gi, result, snippetStarts = [];
			while ( (result = regexStart.exec(str)) ) {
				snippetStarts.push(result.index);
			}

			// get all positions where any snippet ends
			var regexEnd = /\{% endbox %\}/gi, snippetEnds = [];
			while ( (result = regexEnd.exec(str)) ) {
				snippetEnds.push(result.index + 12);	// 12 is the length of snippet end {% endbox %}
			}

			// check if cursor is inside any snippet
			var foundIndex = null;
			for (var i = 0; i < snippetStarts.length; i++) {
				if (position >= snippetStarts[i] && position <= snippetEnds[i]) {
					foundIndex = i;
					break;
				}
			}

			if (foundIndex == null) {
				return;
			}

			var foundSnippetPosition = {
				start: snippetStarts[foundIndex],
				end: snippetEnds[foundIndex]
			};

			// select the text surrounding the snippet
			el.setInputSelection(foundSnippetPosition.start, foundSnippetPosition.end);

			// get snippet text
			var snippet = str.substring(foundSnippetPosition.start, foundSnippetPosition.end);

			// parse snippet to get info about it
			var snippetInfo = this.getSnippetInfo(snippet);
			snippetInfo.snippetPosition = foundSnippetPosition;

			// snippet contains photos.photo resource
			if (!snippetInfo.lookup_name) {
				return;
			}

			if (snippetInfo.type == 'photos.photo') {
				// render photo form
				can.view( '//app/articles/views/list-photos-item.ejs', {
					photo: Photo.findOne( { id: snippetInfo.lookup_value } ),
					data: snippetInfo,
					insideArticle: true
				} ).then(function( frag ){
					snippetBox
						.append('<table></table>')
						.append('<button class="btn btn-primary snippet-update" data-snippet-start="'+foundSnippetPosition.start+'" data-snippet-end="'+foundSnippetPosition.end+'">'+$.t('Update photo')+'</button> ')
						.append('<button class="btn snippet-cancel">'+$.t('Cancel')+'</button>')
						.find('table').html(frag);
				});
			} else if (snippetInfo.type == 'ella_wikipages.wikipage') {
				WikiPage.findOne({slug: snippetInfo.lookup_value.substring(1, snippetInfo.lookup_value.length-1)}, function(wikiPage) {
					snippetInfo.lookup_object = wikiPage;
					self.insertWikiRef(el, snippetInfo)
				})
			} else if (snippetInfo.type == 'ella_galleries.gallery') {
				Gallery.findOne({id: snippetInfo.lookup_value}, function(instance) {
					snippetInfo.lookup_object = instance;
					self.insertGalleryRef(el, snippetInfo)
				})
			}
		},

		/**
		 * return info about snippet
		 * @param  {string} snippet [description]
		 * @return {type: string, id: int} object with snippet type and id
		 */
		getSnippetInfo: function(snippet) {
			//TODO - do it more generic

			var snippetInfo = {};

			// {% box inline_standard_ctverec for photos.photo with pk 3 %}

			// size
			var reSize = /inline_([a-z]*)_/;
			var matchSize = snippet.match(reSize);
			if (matchSize && matchSize[1].length) snippetInfo.size = matchSize[1];

			// format
			var reFormat = /inline_[a-z]*_(\w+)/;
			var matchFormat = snippet.match(reFormat);
			if (matchFormat && matchFormat[1].length) snippetInfo.format = matchFormat[1];

			// we need to get "photos.photo"
			var reType = /([a-z_]*[.][a-z_]*)/g;
			var matchType = snippet.match(reType);
			if (matchType && matchType[0].length) snippetInfo.type = matchType[0];

			// get lookup param
			var reId = /\swith\s(\w+)\s(\S+)/;
			var matchId = snippet.match(reId);
			if (matchId && matchId[1] && matchId[2]) {
				snippetInfo.lookup_name = matchId[1];
				snippetInfo.lookup_value = matchId[2];
			}

			// get photo's align
			var reAlign = /\Walign:(\w+)/;
			var matchAlign = snippet.match(reAlign);
			if (matchAlign && matchAlign[1]) snippetInfo.align = matchAlign[1];

			//title
			var reTitle = /\Wtitle:(.*)/;
			var matchTitle = snippet.match(reTitle);
			if (matchTitle && matchTitle[1]) snippetInfo.title = matchTitle[1];

			// get photo's params (show_title, show_description, ...)
			var reShow = /show_(\w+):(\w+)/g,
				matchShow = snippet.match(reShow),
				split;

			if (matchShow && matchShow.length) {
				for (var i = 0; i < matchShow.length; i++) {
					split = matchShow[i].split(":");
					snippetInfo[split[0]] = parseInt(split[1], 10);
				}
			}

			return snippetInfo;
		},

		/**
		 * update snippet in textarea
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.snippet-update click' : function(el, ev) {

			ev.preventDefault();

			var snippetBox = $(el).closest('.js-textrea-box').find('.box-snippet'),
				oldSnippetStart = el.data('snippet-start'),
				oldSnippetEnd = el.data('snippet-end'),
				textarea = el.closest('.control-group').find('textarea'),
				text = textarea.val(),
				form = snippetBox.find('form'),
				params = can.deparam(form.serialize()),
				snippetObject = null;

			var boxType = form.data('content');
			if (boxType == 'photos.photo') {
				snippetObject = snippetBox.find('tr:first').data('photo');
			} else if (boxType == 'ella_wikipages.wikipage') {
				snippetObject = params.slug
			} else if (boxType == 'ella_galleries.gallery') {
				snippetObject = params.id;
			}

			if (!snippetObject) {
				return false;
			}

			var newSnippet = this.generateSnippet(boxType, snippetObject, params);
			// replace old snippet with new snippet in textarea
			textarea.val(text.substr(0, oldSnippetStart) + newSnippet + text.substr(oldSnippetEnd))

			// hide editing box
			snippetBox.empty();
		},

		/**
		 * hide editing box
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.snippet-cancel click' : function(el, ev) {
			ev.preventDefault();
			$('.box-snippet').empty();
		},

		'.add-side-category click': function (el, ev) {
			var self = this;
			ev.preventDefault();

			var renderForm = can.view.render('//app/articles/views/inline-side-category.ejs', {
				listing: new Listing()
			});

			var sideCats = $("#side_categories");

			sideCats.append(renderForm);

			sideCats.find(".listing_category").ajaxChosen({
				type: 'GET',
				url: BASE_URL + '/category/?',
				jsonTermKey: 'title__icontains',
				dataType: 'json'
			}, function (data) {
				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.resource_uri, text: val.full_title });
				});

				return results;
			});

			sideCats.find(".publish_from, .publish_to").datepicker(self.options.dateOptions)
				.on('changeDate', function (ev) {
					var from = sideCats.find(".publish_from").val(),
						to = sideCats.find(".publish_to").val();
					if (to && from > to) {
						sideCats.find('.date-alert').show();
					} else {
						sideCats.find('.date-alert').hide();
					}
				});
			sideCats.find('.timepicker-default').timepicker(self.options.timeOptions);

		},

		'.js-remove-item click': function(el, ev) {

			ev.preventDefault();

			var orly = confirm($.t('Do you really want to remove given item?'))
			if (!orly) { return; }

			var itemSpace = $(el).closest('.js-removable-item');
			var instance = $(itemSpace).data('instance');

			instance.destroy(function() {
				itemSpace.fadeOut().remove();
			});
		},

		/**
		 * shows article preview
		 * @return {[type]} [description]
		 */
		showPreview: function() {
			function getBaseUrl(url) {
				var parser = document.createElement('a');
				parser.href = url;

				return parser.protocol + '//' + parser.host + '/';
			}

			// save article / gallery before it is previews
			var errors = this.save();

			if (errors === true) {
				window.open(getBaseUrl(BASE_URL) + 'preview/'+ this.article.id +'/');
			}
			else {
				this.showErrors(errors);
			}
		},

		destroy: function() {

			// clear timer
			this.stopAutosave();

			can.Control.prototype.destroy.call( this );
		}
	})
);
