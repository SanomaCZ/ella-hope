steal(
	'//app/resources/plugins/markitup/jquery.markitup.js'
	, '//app/resources/plugins/markitup/sets/markdown/set.js'
	, '//app/resources/plugins/markitup/skins/markitup/style.css'
	, '//app/resources/plugins/markitup/sets/markdown/style.css'
	, '//app/resources/js/slug.js'
	, '//app/resources/js/jquery-ui/jquery.ui.core.js'
	, '//app/resources/js/jquery-ui/jquery.ui.widget.js'
	, '//app/resources/css/jquery-ui/base/jquery-ui.css'
	, '//app/resources/css/jquery-ui/ui-lightness/jquery-ui.css'
	, '//app/resources/js/ajax-chosen.js'	// https://github.com/meltingice/ajax-chosen
)
.then(
	'//app/resources/js/jquery-ui/jquery.ui.mouse.js'
)
.then(
	'//app/resources/js/jquery-ui/jquery.ui.draggable.js',
	'//app/resources/js/jquery-ui/jquery.ui.droppable.js',
	'//app/resources/js/jquery-ui/jquery.ui.sortable.js',

	ArticleCreate = can.Control(
	/* @static */
	{
		defaults: {
			autosaveInterval: 30 * 1000,	// how ofter is draft automatically saved
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
					{name:'Link', key:'L', openWith:'[', closeWith:']([![Url:!:http://]!] "[![Title]!]")', placeHolder:'Your text to link here...' }
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
		photoPaginator: null,	// paginator for photos

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

			this.initPhotosPagination();

			// initialize autosave
			this.initAutosave(this.options.autosaveInterval);
		},

		/**
		 * displays form for creating/updating article
		 * @param  {can.Model.Article} article If article is provided -> edit
		 * @return {[type]}         [description]
		 */
		show: function(article){

			var self = this;

			//console.log(article);

			this.article = article;
			if (!this.article) {

				//console.log('new article');
				// we want to create a new article / gallery
				this.article = this.options.model === 'articles' ? new Article() : new Gallery();
				this.article.static = (this.options.model === 'galleries');
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
				// //console.log('photo: ', photo);

				if (!photo) {
					$('.title-photo img').attr('src', '');
					//$('form.article').find('input[name=photo]').val('');
					$('.title-photo-empty').show();
					$('.title-photo').hide();
				}
				else {
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
				author: Author.findAll({limit: 0}),
				category: Category.findAll({limit: 0}),
				states: this.options.articleStates,
				comments: this.options.articleComments,
				photos: Photo.findAll(),
				source: Source.findAll({limit: 0}),
				tag: Tag.findAll({limit: 0}),
				relatedArticles: this.article.id ? Article.getRelatedArticles(this.article.id) : [],
				listing: this.article.id ? Listing.getListingByArticle({articleId: this.article.id}) : {},
				galleryitem: this.article.id && self.options.model === 'galleries' ? GalleryItem.getRelated(this.article.id) : {},
				model: self.options.model
			} ).then(function( frag ){
				self.element.html(frag);

				// enable chosen select
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();
				$('.enable_comments, .listing').chosen({allow_single_deselect:true});

				$('.article-tags, .article-main-tag').ajaxChosen({
					type: 'GET',
					url: BASE_URL+'/tag/?',
					jsonTermKey: 'name__icontains',
					dataType: 'json'
				}, function (data) {

					var results = [];

					$.each(data, function (i, val) {
						results.push({ value: val.resource_uri, text: val.name });
					});

					return results;
				});

				// enable markup in all textareas
				$("textarea").markItUp(self.options.markitupSettings);

				// enable datepicker for publishFrom and publishTo
				$("#publish_from, #publish_to").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						var from = $("#publish_from").val(),
							to = $("#publish_to").val();
						if (to && from > to){
							$('#date-alert').show();
						} else {
							$('#date-alert').hide();
						}
					});

				// enable datepicker for listing publishFrom and publishTo
				$("#listing_publish_from, #listing_publish_to").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						var from = $("#listing_publish_from").val(),
							to = $("#listing_publish_to").val();
						//console.log('change', from, to);
						if (to && from > to){
							$('#listing-date-alert').show();
						} else {
							$('#listing-date-alert').hide();
						}
					});

				// enable timepicker for publishFrom and publishTo
				var timeOptions = {
					minuteStep: 1,
					showSeconds: false,
					defaultTime: false, // 'value',
					showMeridian: false // enable 24 hours mode
				};
				$("#publish_from_time, #publish_to_time, #listing_publish_from_time, #listing_publish_to_time").timepicker(timeOptions);

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
							el.data('resource_id', data.id);
							el.append('<i class="icon-remove pull-right remove-related"></i>');
						});
					}
				}).disableSelection();

				// gallery - gallery items - enable drag&drop between two lists
				$( "#found-recent-photos, #chosen-recent-photos" ).sortable({
					connectWith: "#chosen-recent-photos",
					// when new article is dropped to related articles
					receive: function(event, ui) {
						var el = $(ui.item[0]),
							receivedID = el.data('photo-id'),
							articleID = self.article.resource_uri;

						// save new relation
						var item = new GalleryItem({
							gallery: articleID,
							photo: receivedID,
							order: 0
						});
						item.save();
						// Article.addRelatedArticle(articleID, receivedID, function(data){
						// 	// add resource_uri to an element so that it can be deleted
						// 	el.data('resource_id', data.id);
						// 	el.append('<i class="icon-remove pull-right remove-related"></i>');
						// });
					}
				}).disableSelection();

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
							//console.log('setting ' + name + ' to readonly');
						}
						if (value._data.disabled === true) {
							$('.'+name).parent('.row').remove();
							//console.log('hiding ' + name);
						}
					}
				});
			});

			this.element.slideDown(200);
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

		/**
		 * stop autosave timer
		 * @return {[type]} [description]
		 */
		stopAutosave: function() {
			clearInterval(this.autosaveTimer);
			this.autosaveTimer = null;
		},

		/**
		 * (auto)saves an article as a draft or as an article, if all required fields
		 * are filled correctly
		 * @return {[type]} [description]
		 */
		save: function() {

			var self = this,
				autosaveLink = $('a.autosave'),
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
			var errors = this.createArticle();

			if (errors === true) {
				// there are no errors
				this.deleteDraft();
				return true;
			}
			else {
				// there are some errors, save article as a draft and send errors back
				this.saveDraft();
				return errors;
			}
		},

		/**
		 * create article model from form values
		 * @return {[type]} [description]
		 */
		createArticle: function() {

			//console.log('create');

			var form = $('form.article'),
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

			// if published is not present, set to false
			if (!values['published']) values['published'] = false;

			// if static is not present, set to false
			if (!values['static']) values['static'] = false;

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

			//console.log('save', values);

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

			//console.log(this.article);

			// check for errors (validation)
			var errors = this.article.errors();

			// no errors
			if (errors === null) {
				// save article
				this.article.save(function(){
					//console.log('ok');
				}, function(xhr){
					//console.log('error');
					alert('Error occured, try again later.');
					return false;
				});

				// listing - must be saved when article exists
				if (values['listing']) {
					if (!this.article.id) {
						alert('Side category (listing) error - probably article is not saved');
					}
					else {
						this.saveListing(this.article, values);
					}
				}

				return true;
			}
			else {
				//this.article.destroy();
				return errors;
			}
		},

		/**
		 * highlight inputs with error
		 * @param  {[type]} errors [description]
		 * @return {[type]}        [description]
		 */
		showErrors: function(errors) {

			if (errors && errors !== true) {
				$.each(errors, function(e){
					//console.log(e);
					$('.'+e).closest('.control-group')
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
		 * @param {model} article - instance of article
		 * @param {array} values - object w/ values for article
		 */
		saveListing: function(article, values) {

			//console.log('save listing', article, values);

			var listingPublishFrom = null,
				listingPublishTo = null,
				commercial = null;

			// prepare object for Listing model
			var listingAttrs = {
				publishable: article.resource_uri,
				category: values['listing']
			};

			if (values['listing_publish_from_date']) {
				listingAttrs.publish_from = values['listing_publish_from_date']+'T'+values['listing_publish_from_time'];
			}
			if (values['listing_publish_to_date']) {
				listingAttrs.publish_to = values['listing_publish_to_date']+'T'+values['listing_publish_to_time'];
			}
			if (values['listing_commercial']) {
				listingAttrs.commercial = values['listing_commercial'];
			}
			else {
				listingAttrs.commercial = false;
			}

			// check if current article has already saved listing
			Listing.getListingByArticle({articleId: article.id}, function(data){

				// create new Listing
				// if id is present, it will update the existing one
				var listing = new Listing(listingAttrs);

				//console.log('listing id', listing.id);

				// if listing exists, update it
				// if it does not exists, create it
				if (data.length && data[0].id) {
					listing.id = data[0].id;
				}

				//console.log(listing);

				// create or update - based on existing id
				listing.save();
			});
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

		'.article input keyup': function(el, ev) {
			ev.preventDefault();

			if(ev.keyCode == 13){
				this.save();
			}
		},
		'.article-save click' : function(el, ev){

			ev.preventDefault();

			ev.stopPropagation();

			var errors = this.save();

			if (errors === true) {

				// stop autosave when leaving article
				this.stopAutosave();

				// redirect to list
				var page = this.options.model === 'articles' ? 'articles' : 'galleries';
				can.route.attr({page: page}, true);
			}
			else {
				this.showErrors(errors);
			}
		},
		'.autosave click' : function(el, ev) {
			this.save();
		},
		'.preview click' : function(el, ev) {
			this.showPreview();
		},
		'.cancel click' : function(){

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

			// mark article as published
			$('input[name=published]').attr('checked', 'checked');
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
			target = el.data('target');

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
		generateSnippet: function(type, object, format) {

			return ["{% box inline_"+format.size+"_"+format.format+" for "+type+" with pk "+object.id+" %}",
						"align:"+format.align,
						format.title ? 'show_title:1' : 'show_title:0',
						format.description ? 'show_description:1' : 'show_description:0',
						format.authors ? 'show_authors:1' : 'show_authors:0',
						format.source ? 'show_source:1' : 'show_source:0',
						format.detail ? 'show_detail:1' : 'show_detail:0',
						"{% endbox %}"
					].join('\n');
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

		/**
		 * render photos in dialog so that user can choose photo
		 * @return {[type]} [description]
		 */
		renderPhotosList: function(data) {

			var self = this;

			if (!this.photoPaginator) {
				this.initPhotosPagination();
			}

			// render list
			can.view( '//app/articles/views/list-photos.ejs', {
				photos: Photo.findAll({
					order_by: '-id',
					offset: self.photoPaginator.attr('offset'),
					limit: self.photoPaginator.attr('limit')
				}),
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

			// hide list of photos
			var photosTable = el.closest('.modal-body').find('table');
			photosTable.hide();

			// append new div and create PhotosUpload control in it
			el.closest('.modal-body').append('<div class="upload"></div>');
			var photosUpload = el.closest('.modal-body').find('.upload');
			var photosUploadControl = new PhotosUpload(photosUpload, {});

			// when photos are uploaded, dostroy PhotosUpload and restore photos list
			photosUpload.on('photos-uploaded', function(ev){

				// update photos list
				self.renderPhotosList({});

				// remove upload form
				photosUpload.remove();

				// show list of photos
				photosTable.show();
			});
		},

		/**
         * pagination for photo list
         * @return {[type]} [description]
         */
        initPhotosPagination: function() {

			var self = this;

			this.photoPaginator = new can.Observe({
				limit: 5,
				offset: 0
			});

			// when paginator attribute changes, reload articles list
			this.photoPaginator.bind('change', function(ev, attr, how, newVal, oldVal) {
				self.renderPhotosList({});
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
		'.get-articles-by-name click': function(el, ev) {

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
				el.parent().fadeOut();
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
		'.get-photos-by-name click': function(el, ev) {

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
				el.append('<li data-photo-id="'+photo.resource_uri+'"><img height="60px" src="'+photo.public_url+'" /> '+photo.title+'</li>');
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
			el.parent().fadeOut();
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

			// get current cursor position
			var position = el.getCursorPosition();
			//console.log(position);

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

			//console.log(snippetStarts);
			//console.log(snippetEnds);

			// check if cursor is inside any snippet
			var foundIndex = null;
			for (var i = 0; i < snippetStarts.length; i++) {
				if (position >= snippetStarts[i] && position <= snippetEnds[i]) {
					foundIndex = i;
					break;
				}
			}

			// container where snippet can be edited
			var snippetBox = el.closest('.controls').siblings('.box-snippet');

			if (foundIndex !== null) {

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

				// snippet contains photos.photo resource
				if (snippetInfo.type == 'photos.photo' && snippetInfo.id) {

					// render photo form
					can.view( '//app/articles/views/list-photos-item.ejs', {
						photo: Photo.findOne( { id: snippetInfo.id } ),
						data: snippetInfo,
						insideArticle: true
					} ).then(function( frag ){
						snippetBox.empty()
							.append('<table></table>')
							.append('<button class="btn btn-primary snippet-update" data-snippet-start="'+foundSnippetPosition.start+'" data-snippet-end="'+foundSnippetPosition.end+'">'+$.t('Update photo')+'</button> ')
							.append('<button class="btn snippet-cancel">'+$.t('Cancel')+'</button>')
							.find('table').html(frag);
					});
				}
				else {
					snippetBox.empty();
				}
			}
			else {
				// clean...
				snippetBox.empty();
			}
		},

		/**
		 * return info about snippet
		 * @param  {string} snippet [description]
		 * @return {type: string, id: int} object with snippet type and id
		 */
		getSnippetInfo: function(snippet) {

			var snippetInfo = {};

			// {% box inline_standard_ctverec for photos.photo with pk 3 %}

			// size
			var reSize = /inline_([a-z]*)_/;
			var matchSize = snippet.match(reSize);
			if (matchSize[1].length) snippetInfo.size = matchSize[1];

			// format
			var reFormat = /inline_[a-z]*_(\w+)/;
			var matchFormat = snippet.match(reFormat);
			if (matchFormat[1].length) snippetInfo.format = matchFormat[1];

			// we need to get "photos.photo"
			var reType = /([a-z]*[.][a-z]*)/g;
			var matchType = snippet.match(reType);
			if (matchType[0].length) snippetInfo.type = matchType[0];

			// get primary key "3"
			var reId = /pk\s(\d+)/;
			var matchId = snippet.match(reId);
			if (matchId[1]) snippetInfo.id = parseInt(matchId[1], 10);

			// get photo's align
			var reAlign = /align:(\w+)/;
			var matchAlign = snippet.match(reAlign);
			if (matchAlign[1]) snippetInfo.align = matchAlign[1];

			// get photo's params (show_title, show_description, ...)
			var reShow = /show_(\w+):(\w+)/g,
				matchShow = snippet.match(reShow),
				split;
			for (var i = 0; i < matchShow.length; i++) {
				split = matchShow[i].split(":");
				snippetInfo[split[0]] = parseInt(split[1], 10);
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

			var snippetBox = el.closest('.box-snippet'),
				photo = snippetBox.find('tr').eq(0).data('photo'),
				oldSnippetStart = el.data('snippet-start'),
				oldSnippetEnd = el.data('snippet-end'),
				textarea = el.closest('.control-group').find('textarea'),
				text = textarea.val(),
				form = snippetBox.find('form'),
				params = can.deparam(form.serialize());

			// generate new snippet
			var newSnippet = this.generateSnippet('photos.photo', photo, params);

			// replace old snippet with new snippet in textarea
			var oldSnippet = text.substr(oldSnippetStart, oldSnippetEnd - oldSnippetStart);
			textarea.val(text.replace(oldSnippet, newSnippet));

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
			el.closest('.box-snippet').empty();
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
