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

			this.element.html(can.view(this.options.initView, this.options));

			if (!can.route.attr('action')) {
				this.listPhotos();
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
				var photosUpload = new PhotosUpload(this.element, {});
			}
		},

		':page/:action/:id route': function( data ) {

			var self = this;

			if (data.action == 'edit') {
				if (data.id > 0) {
					Photo.findOne({id: data.id}, function(photo){
						new PhotosUpload(self.element, {
							photo: photo
						});
					})
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
		'listPhotos': function() {

			var self = this;

			can.view('//app/photos/views/list-photos.ejs', {
				photos: Photo.findAll()
			}).then(function( frag ){
				$("#inner-content").html( frag );
			});
		}
	})
)