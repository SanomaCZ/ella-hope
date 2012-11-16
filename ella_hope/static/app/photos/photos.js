steal(
	//'./css/search_result.css'
	'./upload-photos.js'
	, './photos.css'
	, '//app/resources/js/bootstrap.min.js'
	, '//app/resources/js/bootbox.min.js'	// alert, confirm, flexible dialogs
	, '//app/resources/js/date.js'	// date parse
	, '//app/resources/js/bootstrap-datepicker.js'	// datepicker js
	, '//app/resources/css/bootstrap-datepicker.css'	// datepicker css
	, '//app/resources/js/bootstrap-timepicker.js'	// timepicker js
	, '//app/resources/css/bootstrap-timepicker.css'	// timepicker css
	, '//app/resources/js/jquery.chosen.js'	// select list js
	, '//app/resources/css/jquery.chosen.css'	// select list css
)
.then(

	/**
	 * Shows the photos.
	 * @tag controllers
	 */
	Photos = can.Control(
	/* @static */
	{
		defaults: {
			initView : "//app/photos/views/init.ejs"
		}
	},
	/* @prototype */
	{
		photosUpload: null,
		/**
		 * Initializes a new instance of Articles container.
		 * @codestart
		 * $(selector).skimapnet_search_result({
		 *	modelType : skimapnet.Models.Google,
		 *  listenTo : $('#searchBox')
		 * })
		 * @codeend
		 */
		init: function(element, options){

			var self = this;

			can.view(this.options.initView, {
				author: Author.findAll(),
				tag: Tag.findAll()
			}).then(function( frag ){
				self.element.html( frag );
			}).then(function(){
				// enable datepicker for publishFrom and publishTo
				// https://github.com/eternicode/bootstrap-datepicker
				// $("input[name=publish_from]").datepicker(self.options.dateOptions)
				// 	.on('changeDate', function(ev){
				// 		self.filterArticles();
				// 	});
				// $("input[name=publish_to]").datepicker(self.options.dateOptions)
				// 	.on('changeDate', function(ev){
				// 		self.filterArticles();
				// 	});

				$(".filter-form select").on('change', function(ev){
						self.filterPhotos();
				});

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen({allow_single_deselect:true});
			});

			if (!can.route.attr('action')) {
				this.listPhotos( {} );
			}
		},

		':page route': function( data ) {
			if (data.page == 'photos') {
				this.init();
				this.listPhotos();
			}
		},

		':page/:action route': function( data ) {
			if (data.action == 'new-photos') {
				if (this.photosUpload) {
					this.photosUpload.destroy();
					this.photosUpload = null;
				}
				this.photosUpload = new PhotosUpload(this.element, {});
			}
		},

		':page/:action/:id route': function( data ) {

			var self = this;

			if (data.action == 'edit') {
				if (data.id > 0) {
					Photo.findOne({id: data.id}, function(photo){
						if (this.photosUpload) {
							this.photosUpload.destroy();
							this.photosUpload = null;
						}
						this.photosUpload = new PhotosUpload(self.element, {
							photo: photo
						});
					});
				}
			}
        },

		/**
		 * delete article
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.delete click': function(el, ev){

			ev.preventDefault();

			bootbox.confirm(el.data('confirm'), function(confirmed) {
				if (confirmed) {
					el.data('photo').destroy();
					el.closest('tr').slideUp(200);
				}
			});
		},

		/**
		 * list photos
		 * @return {[type]} [description]
		 */
		'listPhotos': function(data) {

			if (data) {
				//data.order_by = '-id';
			}
			else {
				data = {
					//order_by: '-id'
				};
			}

			can.view('//app/photos/views/list-photos.ejs', {
				photos: Photo.findAll(data)
			}).then(function( frag ){
				$("#inner-content").html( frag );
			});
		},

		/**
		 * search photos based on title
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.search-photos click' : function(el, ev) {

			ev.preventDefault();

			// get search term
			var search = el.siblings('input.search-query').val();

			// search articles containing search term in title
			this.listPhotos({
				title__icontains: search
			});
		},

		/**
		 * filter photos
		 * @return {[type]} [description]
		 */
		filterPhotos : function() {

			// data from filter form
			var data = {};

			// author
			if ($("select[name=author]").val()) {
				data.authors__id = $("select[name=author]").val();
			}

			// tag
			if ($("select[name=tag]").val()) {
				data.tags__id = $("select[name=tag]").val();
			}

			// show photos based on filter data
			this.listPhotos(data);
		},

		/**
		 * show/hide filtering form
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.filter-photos click' : function(el, ev) {

			ev.preventDefault();

			// show/hide filtering form
			$('.filter-form').toggle();
		}
	})
);