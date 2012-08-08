Create = can.Control({
	/**
	 * displays form for creating/updating article
	 * @param  {can.Model.Article} article If article is provided -> edit
	 * @return {[type]}         [description]
	 */
	show: function(article){

		console.log(article);

		this.article = article;
		if (!this.article) {
			// we want to create a new article
			this.article = new Article();
		}
		this.element.html(can.view('//app/articles/views/create-article.ejs', {
			article: this.article,
			categories: this.options.categories
		}));
		this.element.slideDown(200);
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
		values['publish_from'] =  "2012-08-07T09:47:44";
		values['publish_to'] =  null;
		values['published'] =  true;
		values['resource_uri'] =  "/admin-api/article/6/";
		values['slug'] =  "dfgja";
		values['static'] =  true;
		values['url'] =  "http://example.com/sub/6-dfgj/";

		if (!values['id']) delete values['id'];

		console.log(values);
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
