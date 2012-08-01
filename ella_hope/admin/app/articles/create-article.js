Create = can.Control({
	/**
	 * displays form for creating/updating article
	 * @param  {can.Model.Article} article If article is provided -> edit
	 * @return {[type]}         [description]
	 */
	show: function(article){
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
		console.log('create');
		var form = this.element.find('form');
			values = can.deparam(form.serialize());
			
		console.log(values);
		// validation
		if(1) {
			//this.article.attr(values).save();
			delete values['id'];
			var a = new Article();
			a.attr(values).save();
			console.log(a.attr());
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
