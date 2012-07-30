Create = can.Control({
	show: function(){
		this.article = new Article();
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
	createArticle: function() {
		console.log('create');
		var form = this.element.find('form');
			values = can.deparam(form.serialize());
			
		console.log(values);
		if(values.name !== "") {
			this.article.attr(values).save();
			this.hide();
		}
	},
	'.article input keyup': function(el, ev) {
		console.log(ev.keyCode);
		if(ev.keyCode == 13){
			this.createArticle(el);
			//ev.preventDefault;
		}
	},
	'.save click' : function(el){
		this.createArticle(el);
	},
	'.cancel click' : function(){
		this.hide();
	}
});
