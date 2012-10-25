steal(
	'//app/resources/plugins/markitup/jquery.markitup.js'
	, '//app/resources/plugins/markitup/sets/markdown/set.js'
	, '//app/resources/plugins/markitup/skins/markitup/style.css'
	, '//app/resources/plugins/markitup/sets/markdown/style.css'
)
.then(
	ArticleCreate = can.Control(
	/* @static */
	{
		defaults: {
			autosaveInterval: 30 * 1000,	// how ofter is draft automatically saved
			articleStates: ["added", "ready", "approved", "published", "postponed",	"deleted"],
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
					{separator:'---------------'},
					{name:'Quotes', openWith:'> '},
					{name:'Code Block / Code', openWith:'(!(\t|!|`)!)', closeWith:'(!(`)!)'},
					{separator:'---------------'},
					{name:'Preview', call:'preview', className:"preview"},
					{name:'Test', key:'1', placeHolder:'Your title here...', closeWith:function(markItUp) { return alert('ano'); } }
				]
			}
		}
	},
	/* @prototype */
	{
		draft: null,			// current draft object
		previousDraftValues: null,	// use this for comparison old and new draft values
		autosaveTimer: null,	// timer for autosave, we need this to stop timer

		init: function() {

			if (this.options.type == 'draft') {
				this.showDraft(this.options.article);
			}
			else {
				this.show(this.options.article);
			}
		},

		/**
		 * displays form for creating/updating article
		 * @param  {can.Model.Article} article If article is provided -> edit
		 * @return {[type]}         [description]
		 */
		show: function(article){

			var self = this;

			// initialize autosave
			// autosave is only used for new articles or when editing drafts
			// hopefuly we don't need to autosave already existing article
			// if we do, how to deal with already saved article and then we remove some
			// required attribute - destroy the article and save only as a draft?
			if (typeof article == 'undefined' || this.draft) {
				this.initAutosave(this.options.autosaveInterval);
			}

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
				photos: Photo.findAll()
				//photoFormat: PhotoFormat.findAll()
			} ).then(function( frag ){
				self.element.html(frag);

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();

				// enable markup in all textareas
				$("textarea").markItUp(self.options.markitupSettings);

				// enable datepicker for publishFrom and publishTo
				// https://github.com/eternicode/bootstrap-datepicker
				var dateOptions = {
					format: 'yyyy-mm-dd',
					weekStart: 1,
					autoclose: true
				};
				$("#publish_from_date").datepicker(dateOptions)
					.on('changeDate', function(ev){
						if ($("#publish_to_date").val() && $("#publish_from_date").val() > $("#publish_to_date").val()){
							$('#date-alert').show();
						} else {
							$('#date-alert').hide();
						}
					});
				$("#publish_to_date").datepicker(dateOptions)
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
		 * show draft for editing
		 * @param  {[type]} draft [description]
		 * @return {[type]}       [description]
		 */
		showDraft: function(draft) {
			this.draft = draft;
			this.show(draft.data);
		},

		/**
		 * initialize autosave timer
		 * @param  {[type]} interval [description]
		 * @return {[type]}          [description]
		 */
		initAutosave: function(interval) {


			//console.log('init autosave');

			var self = this;

			this.autosaveTimer = setInterval(function(){
				self.saveDraft();
			}, interval);
		},

		/**
		 * stop autosave timer
		 * @return {[type]} [description]
		 */
		stopAutosave: function() {
			clearInterval(this.autosaveTimer);
		},

		createArticle: function() {

			//console.log('create');

			var form = this.element.find('form'),
				values = form.serialize();
			values = can.deparam(values);

			values['announced'] = false;
			values['app_data'] =  "{}";
			//values['last_updated'] =  "2012-08-07T09:47:44";
			//values['listings'] =  [];//Constructor[0];
			values['photo'] =  null;

			// merge date and time of publish_from
			values['publish_from'] = values['publish_from_date']+'T'+values['publish_from_time']; //"2012-08-07T09:47:44";

			// merge date and time of publish_to
			values['publish_to'] = null;
			if (values['publish_to_date']) {
				values['publish_to'] = values['publish_to_date']+'T'+values['publish_to_time'];
			}

			// if published is not present, set to false
			if (!values['published']) values['published'] = false;

			values['resource_uri'] =  "/admin-api/article/6/";
			values['slug'] =  "dfgja";
			values['static'] =  true;
			values['url'] =  "http://example.com/sub/6-dfgj/";

			if (!values['id']) delete values['id'];

			//console.log(values);
			// validation
			if(1) {
				//this.article.attr(values).save();
				//delete values['id'];
				var a = new Article();
				//a.attr(values).save();
				a.attr(values);
				//console.log(a);
				a.save();
				//this.hide();

				// delete draft when article is saved
				if (this.draft) {
					this.draft.destroy();
				}

				can.route.attr({page:'articles'}, true);
			}
		},

		/**
		 * save the article as a draft
		 * @param  {[type]} el [description]
		 * @return {[type]}    [description]
		 */
		saveDraft : function(el) {

			var self = this;

			var form = this.element.find('form');
			var values = form.serialize();
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
				console.log('new draft');
				this.draft = new Draft();
			}

			this.draft.attr(obj);
			this.draft.save();

		},
		saveArticle: function() {

			this.stopAutosave();
			this.createArticle();
		},
		'.article input keyup': function(el, ev) {
			ev.preventDefault();

			if(ev.keyCode == 13){
				this.saveArticle();
			}
		},
		'.article-save click' : function(el, ev){

			ev.stopPropagation();

			this.saveArticle();
		},
		'.autosave click' : function(el, ev) {
			this.saveDraft(el);
		},
		'.cancel click' : function(){

			this.stopAutosave();

			// if there is automaticaly saved draft, delete it
			if (this.draft) {
				this.draft.destroy();
			}

			can.route.attr({page:'articles'}, true);
		},

		'select[name=drafts] change': function(el, ev) {
			var draft = $(el.find('option:selected')).data('article');
			//console.log(this.article.attr());
			//console.log(draft);
			//this.article.attr({title: 'hehe'});
			this.article.attr(draft.data._data);
			//console.log(this.article.attr());

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

			var snippet =
				["{% box inline_"+format.size+"_"+format.format+" for photos.photo with pk "+photo.id+" %}",
					"align:"+format.align,
					format.title ? 'show_title:1' : 'show_title:0',
					format.description ? 'show_description:1' : 'show_description:0',
					format.authors ? 'show_authors:1' : 'show_authors:0',
					format.source ? 'show_source:1' : 'show_source:0',
					format.detail ? 'show_detail:1' : 'show_detail:0',
					"{% endbox %}"
				].join('\n');

			$.markItUp( { replaceWith: snippet } );
			//console.log(photo);

			$('#photos-modal').modal('hide');
		},

		insertPhoto: function() {

			$('#photos-modal').modal('show');
		}
	})
);