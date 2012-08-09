Create = can.Control({
	/**
	 * displays form for creating/updating article
	 * @param  {can.Model.Article} article If article is provided -> edit
	 * @return {[type]}         [description]
	 */
	show: function(article){

		//console.log(article);

		this.article = article;
		if (!this.article) {
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
		this.element.html(can.view('//app/articles/views/create-article.ejs', {
			article: this.article,
			categories: this.options.categories
		}));
		this.element.slideDown(200);

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
	},
	hide: function(){
		this.element.slideUp(200);
	},
	'{document} #new-article click': function(){
		this.show();
	},

	'{document} .edit-article click': function(el, ev){
		//this.show(el.data('article'));
	},

	createArticle: function() {

		var form = this.element.find('form');
		var values = form.serialize();
		var values = can.deparam(values);
		
		delete values['authors'];
		delete values['category'];
		delete values['publish_to'];

		values['announced'] = false;
		values['app_data'] =  "{}";
		values['authors'] =  [{"description": "", "email": "", "id": 1, "name": "Seocity", "resource_uri": "/admin-api/author/1/", "slug": "seocity", "text": ""}];
		values['category'] =  "/admin-api/category/2/"; //Constructor;
		values['last_updated'] =  "2012-08-07T09:47:44";
		values['listings'] =  [];//Constructor[0];
		values['photo'] =  null;
		
		values['publish_from'] = values['publish_from_date']+'T'+values['publish_from_time']; //"2012-08-07T09:47:44";
		
		values['publish_to'] = null;
		if (values['publish_to_date']) {
			values['publish_to'] = values['publish_to_date']+'T'+values['publish_to_time'];
		}

		values['published'] = true;
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
			can.route.attr({page:'articles'}, true);
		}
	},
	'.article input keyup': function(el, ev) {
		if(ev.keyCode == 13){
			this.createArticle(el);
		}
	},
	'.save click' : function(el){
		this.createArticle(el);
	},
	'.cancel click' : function(){
		this.hide();
	}
});
