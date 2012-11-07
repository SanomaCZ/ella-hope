steal(
	'//app/resources/plugins/markitup/jquery.markitup.js'
	, '//app/resources/plugins/markitup/sets/markdown/set.js'
	, '//app/resources/plugins/markitup/skins/markitup/style.css'
	, '//app/resources/plugins/markitup/sets/markdown/style.css'
	, '//app/resources/js/slug.js'
)
.then(
	ArticleCreate = can.Control(
	/* @static */
	{
		defaults: {
			autosaveInterval: 5 * 1000,	// how ofter is draft automatically saved
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
		previousDraftValues: null,	// use this for comparison of old and new draft values
		autosaveTimer: null,	// timer for autosave, we need this to stop timer

		init: function() {

			if (this.options.type == 'draft') {
				this.draft = this.options.article;
				this.show(this.draft.data);
			}
			else {
				this.article = this.options.article;
				this.show(this.article);
			}

			// initialize autosave
			//this.initAutosave(this.options.autosaveInterval);
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
				// we want to create a new article
				this.article = new Article();
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

			// render article form
			can.view( '//app/articles/views/create-article.ejs', {
				article: this.article,
				drafts: Draft.findAll(),
				author: Author.findAll(),
				category: Category.findAll(),
				states: this.options.articleStates,
				photos: Photo.findAll(),
				tag: Tag.findAll()
				//photoFormat: PhotoFormat.findAll()
			} ).then(function( frag ){
				self.element.html(frag);

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();

				// enable markup in all textareas
				$("textarea").markItUp(self.options.markitupSettings);

				// enable datepicker for publishFrom and publishTo
				$("#publish_from").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						if ($("#publish_to_date").val() && $("#publish_from_date").val() > $("#publish_to_date").val()){
							$('#date-alert').show();
						} else {
							$('#date-alert').hide();
						}
					});
				$("#publish_to").datepicker(self.options.dateOptions)
					.on('changeDate', function(ev){
						if ($("#publish_from_date").val() && $("#publish_from_date").val() > $("#publish_to_date").val()){
							$('#date-alert').show();
						} else {
							$('#date-alert').hide();
						}
					});

				// enable timepicker for publishFrom and publishTo
				var timeOptions = {
					minuteStep: 1,
					showSeconds: false,
					defaultTime: false, // 'value',
					showMeridian: false // enable 24 hours mode
				};
				$("#publish_from_time").timepicker(timeOptions);
				$("#publish_to_time").timepicker(timeOptions);

				// test settings - setting some attributes to read-only or disabled
				// USER.auth_tree.articles.article.fields.title._data.readonly = true;
				// USER.auth_tree.articles.article.fields.publish_to._data.disabled = true;

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
			values['app_data'] =  "{}";
			values['photo'] =  null;

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

			// app_data is required to be sent, althougt it's empty now
			values['app_data'] = null;

			if (!values['id']) delete values['id'];

			if (this.article) {
				this.article.attr(values);
			}
			else {
				// create new article model and validate it
				this.article = new Article(values);
			}

			// remove all error markup
			$('.control-group').removeClass('error');
			$('.help-inline').empty();

			// check for errors
			var errors = this.article.errors();

			// no errors
			if (errors === null) {
				// save article
				this.article.save();
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
				"content_type": 'article',
				"data" : values
			};

			if (!this.draft) {
				this.draft = new Draft();
			}

			var id;
			if (this.draft) {
				id = this.draft.id;
			}

			this.draft.attr(obj, true);

			if (id) {
				this.draft.attr('id', id);
			}

			this.draft.save();
		},

		/**
		 * if there is automaticaly saved draft, delete it
		 * @return {[type]} [description]
		 */
		deleteDraft: function() {

			if (this.draft) {
				this.draft.destroy();
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
				// redirect to articles list
				can.route.attr({page:'articles'}, true);
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

			can.route.attr({page:'articles'}, true);
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

			//console.log(this.article.attr());
			//console.log(draft);
			//this.article.attr({title: 'hehe'});

			//this.article.attr(draft.data._data);

			//console.log(this.article.attr());
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
		'.add-author click' : function(el, ev) {

			ev.preventDefault();
			$('#author-modal').modal('show');
		},

		/**
		 * generate slug from author name
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#author-modal .slug-from-name click' : function(el, ev) {

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
		'#author-modal .insert-author click' : function(el, ev) {

			ev.preventDefault();

			// form values
			var values = $('#author-modal').find('form').serialize();
			values = can.deparam(values);

			// create new author
			var author = new Author();
			author.attr(values);
			author.save(function(data){
				$('#authors')
					// append new author to authors list and make it selected
					.append('<option value="'+data.resource_uri+'" selected="selected">'+data.name+'</option>')
					// update chosen select
					.trigger('liszt:updated')
					;
			});

			$('#author-modal').modal('hide');
		},

		/**
		 * open a dialog where new tag can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-tag click' : function(el, ev) {

			ev.preventDefault();
			$('#tag-modal').modal('show');
		},

		/**
		 * generate slug from tag name
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#tag-modal .slug-from-name click' : function(el, ev) {

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
		'#tag-modal .insert-tag click' : function(el, ev) {

			ev.preventDefault();

			// form values
			var values = $('#tag-modal').find('form').serialize();
			values = can.deparam(values);

			// create new tag
			var tag = new Tag();
			tag.attr(values);
			tag.save(function(data){
				$('#tags')
					// append new tag to tags list and make it selected
					.append('<option value="'+data.resource_uri+'" selected="selected">'+data.name+'</option>')
					// update chosen select
					.trigger('liszt:updated')
					;
			});

			$('#tag-modal').modal('hide');
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
			ev.preventDefault();

			// get checked radio button, it's tr parent and photo from data attribute
			var tr = $('input[name=photo]:checked', '#photos-modal').parents('tr'),
				photo = tr.data('photo'),
				params = tr.find('.snippet-params'),
				format = can.deparam(params.serialize());

			if (photo) {
				var snippet = this.generateSnippet('photos.photo', photo, format);

				// insert snippet into textarea
				$.markItUp( { replaceWith: snippet } );
				//console.log(photo);

				$('#photos-modal').modal('hide');
			}
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
			this.renderPhotosList();

			// show modal dialog
			$('#photos-modal').modal('show');
		},

		/**
		 * render photos in dialog so that user can choose photo
		 * @return {[type]} [description]
		 */
		renderPhotosList: function() {

			// render list
			can.view( '//app/articles/views/list-photos.ejs', {
				photos: Photo.findAll()
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
				self.renderPhotosList();

				// remove upload form
				photosUpload.remove();

				// show list of photos
				photosTable.show();
			});
		},

		/**
		 * when photos modal dialog is closed, clean... remove upload form if it was not removed
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#photos-modal hide' : function(el, ev) {
			$('#photos-modal').find('.upload').remove();
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

			// TODO
			var id = $('#id').val();

			// save article before it is previews
			var errors = this.save();

			if (errors === true) {
				window.open(getBaseUrl(BASE_URL) + 'preview/'+id+'/');
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
