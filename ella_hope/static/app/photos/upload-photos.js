// file upload - http://jquery.malsup.com/form/
steal(
	'//app/resources/js/file-upload/jquery.form.js'
	, '//app/resources/plugins/jcrop/js/jquery.Jcrop.js'
	, '//app/resources/plugins/jcrop/css/jquery.Jcrop.css'
)
.then(

	PhotosUpload = can.Control(
	/* @static */
	{
		defaults: {
			autosaveInterval: 30 * 1000,	// how ofter is draft automatically saved
			articleStates: ["added", "ready", "approved", "published", "postponed",	"deleted"],
			// settings for Jcrop
			// boxWidth and boxHeight automaticaly scale the image and return coordinates
			// according to original image sizes
			jcropOptions: {
				onSelect: function(coords){PhotosUpload.prototype.updateCoords('.photo-preview img', coords);},
				boxWidth: 600,
				boxHeight: 600
			}
		}
	},
	/* @prototype */
	{
		filelist: null,			// list of selected files for upload
		//ratio: null,			// photo preview size vs original size

		init: function() {
			this.show(this.options.photo);
		},

		/**
		 * displays form for creating/updating article
		 * @param  {can.Model.Article} article If article is provided -> edit
		 * @return {[type]}         [description]
		 */
		show: function(photo){

			var self = this;

			this.photo = photo;
			if (!this.photo) {
				// we want to create a new photo
				this.photo = new Photo();
			}

			// render article form
			can.view( '//app/photos/views/upload-photos.ejs', {
				photo: this.photo,
				author: Author.findAll(),
				source: Source.findAll(),
				tag: Tag.findAll()
			} ).then(function( frag ){
				self.element.html(frag);

				$('#file').on('change', function(){
					self.fileChange();
				});

				var jcropOptions = self.options.jcropOptions;

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();

				// important part of image, based on uploader's crop
				if (jQuery.isNumeric(self.photo.important_top) && jQuery.isNumeric(self.photo.important_left) &&
					jQuery.isNumeric(self.photo.important_bottom) && jQuery.isNumeric(self.photo.important_bottom)) {
					var x = self.photo.important_left,
						y = self.photo.important_top,
						x2 = self.photo.important_right,
						y2 = self.photo.important_bottom
						;

					// we need to wait till image is loaded so we can get real dimensions
					// EDIT: we don't need real dimensions, Jcrop can handle this for us
					//$('.photo-preview').load(function(){

						// // x, y, x2, y2 are coordinates on full-size image
						// // image is usually displayed in smaller size
						// // we need to convert these numbers to current image size
						// var previewImageSize = {
						// 	width: $('.photo-preview').width(),
						// 	height: $('.photo-preview').height()
						// };

						// // create temporary image to get original dimensions
						// var img = new Image();
						// img.src = $('.photo-preview').attr('src');
						// var originalImageSize = {
						// 	width: img.width,
						// 	height: img.height
						// };
						// img = null;

						// self.ratio = previewImageSize.width / originalImageSize.width;

						// x = Math.round(x * self.ratio);
						// y = Math.round(y * self.ratio);
						// x2 = Math.round(x2 * self.ratio);
						// y2 = Math.round(y2 * self.ratio);

						jcropOptions.setSelect = [ x, y, x2, y2 ];
					//});
				}

				// enable crop
				$('.photo-preview img').Jcrop(jcropOptions);
			});

			this.element.slideDown(200);
		},

		/**
		 * get coordinates from Jcrop and update form fields
		 * @param  {[type]} id [description]
		 * @param  {[type]} c  [description]
		 * @return {[type]}    [description]
		 */
		updateCoords: function(element, c) {

			var el = $(element).parents('.upload-image');
			el.find('input[name=important_left]').val(Math.round(c.x));
			el.find('input[name=important_top]').val(Math.round(c.y));
			el.find('input[name=important_right]').val(Math.round(c.x2));
			el.find('input[name=important_bottom]').val(Math.round(c.y2));
		},

		/**
		 * when user selects file(s) to upload
		 * @return {[type]} [description]
		 */
		'fileChange': function(){

			var self = this,
				files = document.getElementById("file").files,
				nFiles = files.length;

			//console.log(files);
			//console.log(files.length);

			// hide message box from previous upload
			$('.response_msg').hide();

			// show upload button
			$('.upload-buttons').show();

			// show progress bar
			$('.progress').show().find('.bar').css('width', '0px');

			// add selected files to observe se that it can be rendered
			for (var i = 0; i < files.length; i++) {

				//this.filelist.files.push(files[i]);

				can.view( '//app/photos/views/photo.ejs', {
					file: files[i],
					photo: {},
					author: Author.findAll(),
					source: Source.findAll(),
					tag: Tag.findAll()
				} ).then(function( frag ){
					$('#images').append(frag);
				});

				// show image next to form
				self.showImagePreview(files[i]);
			}

			// wait till all images a rendered so we can apply chosen select and default values
			setTimeout(function(){

				var $defaults = $('.defaults'),
					$images = $('#images');

				// get default values
				defaultTitle = $defaults.find('input[name=default_title]').val();
				defaultDescription = $defaults.find('input[name=default_description]').val();
				defaultAuthor = $defaults.find('select[name=default_author]').val();

				// set default values
				if (defaultTitle) {
					$images.find('input[name=title]').val(defaultTitle);
				}
				if (defaultDescription) {
					$images.find('textarea[name=description]').val(defaultDescription);
				}
				if (defaultAuthor) {
					$images.find('.authors').find("option[value='"+defaultAuthor+"']").attr("selected", "selected");
				}

				// if filename should be used as default value for any field
				filenameDefault = $defaults.find('select[name=filename_default]').val();
				if (filenameDefault) {
					$images.find('.upload-image').each(function(i, v){
						var filename = $(v).find('input[name=filename]').val();
						filename = filename.substr(0, filename.lastIndexOf('.')) || filename;
						$(v).find('.'+filenameDefault).val(filename);
					});
				}

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();
			}, 1000);

		},

		/**
		 * show image preview before upload
		 * enables crop
		 * @param  {[type]} file [description]
		 * @return {[type]}      [description]
		 */
		showImagePreview: function(file) {

			var self = this;

			// we need to set timeout here otherwise it was too soon and preview elements
			// were not already created
			setTimeout(function(){

				var imageType = /image.*/;

				if (!file.type.match(imageType)) {
					//continue;
				}

				var img = document.createElement("img");
				img.classList.add("obj");
				img.file = file;
				document.getElementById("preview-"+file.size).appendChild(img);

				var reader = new FileReader();
				reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
				reader.readAsDataURL(file);

				setTimeout(function(){
					var id = "#preview-" + file.size;
					if ($(id + " img").length) {
						$(id + " img").Jcrop({
							onSelect: function(coords){self.updateCoords(id, coords);},
							boxWidth: 600,
							boxHeight: 600
						});
					}
				}, 10);
			}, 1000);
		},

		// bind to the form's submit event
		'.uploadForm submit': function(el, ev) {

			var form = el,//.parent('form'),
				values = form.serialize(),
				self = this;

			values = can.deparam(values);

			var objects = [];

			// compose resource_data object from all selected files
			$('.uploadForm').find('.upload-image').each(function(){

				var important_top = $(this).find('input[name=important_top]').val(),
					important_left = $(this).find('input[name=important_left]').val(),
					important_bottom = $(this).find('input[name=important_bottom]').val(),
					important_right = $(this).find('input[name=important_right]').val();

				important_top = important_top ? parseInt(important_top, 10) : null;
				important_left = important_left ? parseInt(important_left, 10) : null;
				important_bottom = important_bottom ? parseInt(important_bottom, 10) : null;
				important_right = important_right ? parseInt(important_right, 10) : null;


				var tags = $(this).find('.photo-tags').val();
				tags = tags ? tags : null;

				var source = $(this).find('.photo-source').val();
				source = source ? source : null;

				objects[objects.length] = {
					"title": $(this).find('.title').val(),
					"slug": $(this).find('.title').val(),
					"description": $(this).find('.description').val(),
					"created": new Date().toISOString(),
					"authors" : $(this).find('.authors').val(),
					"tags" : tags,
					"source" : source,
					"app_data": null,
					"image": "attached_object_id:"+$(this).find('.filename').val(),
					"important_top": important_top,
					"important_left": important_left,
					"important_bottom": important_bottom,
					"important_right": important_right,
					"rotate": parseInt($(this).find('input[name=rotate]').val(), 10)
				};
			});

			// prepare Options Object
			var options = {
				type: "PATCH",
				method: "PATCH",
				url: BASE_URL + '/photo/?username='+USER.attr('username')+'&api_key='+USER.attr('api_key'),
				//url: 'http://localhost/test.php',
				data: {
					resource_data: JSON.stringify({
						objects: objects
					})
				},
				clearForm: true,
				beforeSubmit: function(arr, $form, options) {
					// return false to cancel submit
					return true;
				},
				uploadProgress: function(ev, position, total, percentComplete) {
					// console.log(ev);
					// console.log(position);
					// console.log(total);
					// console.log(percentComplete);
					el.find('.progress .bar').css('width', percentComplete+'%');
				},
				success: function() {
					setTimeout(function(){
						// empty file input so that new files can be chosen
						self.clearFileInput();
						// hide all uploaded images
						$('.upload-image').remove();
						// show upload button
						$('.upload-buttons').hide();
						// show progress bar
						$('.progress').hide();

						// maybe there is someone waiting for upload finish
						// i.e. when user uploads photo directly from an article
						self.element.trigger('photos-uploaded');
					}, 500);
					$('.response_msg')
						.show()
						.addClass('alert-success')
						.find('span').html($.t('<strong>Well done!</strong> Photo uploaded.'));
				},
				error: function() {
					self.clearFileInput();
					$('.response_msg')
						.show()
						.addClass('alert-error')
						.find('span').html($.t('<strong>Stop!</strong> Something went wrong.'));
				}
			};

			// inside event callbacks 'this' is the DOM element so we first
			// wrap it in a jQuery object and then invoke ajaxSubmit
			el.ajaxSubmit(options);

			// !!! Important !!!
			// always return false to prevent standard browser submit and page navigation
			return false;
		},

		/**
		 * update photo
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.photo-save click': function(el, ev) {

			var form = this.element.find('form'),
				values = form.serialize();

			values = can.deparam(values);

			// app_data is required for django, can be set to null but must be there
			values.app_data = null;

			// convert crop coordinates from preview image size to original image size
			if (values.important_top && values.important_left &&
				values.important_bottom && values.important_right) {
				values.important_top = Math.round(values.important_top);
				values.important_left = Math.round(values.important_left);
				values.important_bottom = Math.round(values.important_bottom);
				values.important_right = Math.round(values.important_right);
			}

			var p = new Photo();
			//a.attr(values).save();
			p.attr(values);
			//console.log(a);
			p.save();

			//console.log(values);

			can.route.attr({page:'photos'}, true);
		},

		/**
		 * image rotation
		 * Jcrop is enabled by default - we need to disable it before rotation
		 * TODO: when specification is better - http://hacks.mozilla.org/2011/01/how-to-develop-a-html5-image-uploader/
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.rotate-image click' : function(el, ev) {

			var $img = el.closest('.important-part').children('.photo-preview').children('img'),
				rotation = el.data('rotation') || 0;

			// set input value
			el.closest('form').find('input[name=rotate]').val(rotation);

			// we need to destroy Jcrop to be able to rotate image
			JcropAPI = $img.data('Jcrop');
			if (JcropAPI) JcropAPI.destroy();

			$img
				.css('visibility', 'visible')	// image may be hidden because of Jcrop
				.css('-webkit-transform', 'rotate('+rotation+'deg)') // rotation for webkit
				.css('-moz-transform', 'rotate('+rotation+'deg)'); // rotation for mozilla

			if (rotation == 0 || rotation == 180) {

				$img.parent().css('width', $img.css('width')).css('height', $img.css('height'));

				// adjust position
				$img.css('top', '0px').css('left', '0px');

				// enable Jcrop, because image has same dimensions as before rotation
				$img
					.Jcrop(this.options.jcropOptions)
					.siblings('.jcrop-holder')
					.find('img')
					// also rotate Jcrop elements, otherwise image remained unrotated
					.css('-webkit-transform', 'rotate('+rotation+'deg)')
					.css('-moz-transform', 'rotate('+rotation+'deg)')
						;
			}
			else {
				// do not enable Jcrop, width and height are different and Jcrop can't handle this

				// set parent div to have current image dimensions
				$img.parent().css('width', $img.css('height')).css('height', $img.css('width'));

				// adjust position
				var positionTop = '31px',
					positionLeft = '-31px';
				if ($img.css('width') < $img.css('height')) {
					positionTop = '-31px';
					positionLeft = '31px';
				}
				$img.css('top', positionTop).css('left', positionLeft);
			}
		},

		'.cancel click' : function(){

			this.clearFileInput();
			can.route.attr({page:'photos'}, true);
		},

		clearFileInput: function() {
			$('#file').replaceWith('<input type="file" id="file" name="attached_object" multiple />');
		},

		/**
		 * open a dialog where new tag can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-tag click' : function(el, ev) {

			ev.preventDefault();

			// get target element where new tag should be inserted
			var target = el.data('target');

			// save target to insert-tag button so that
			// we can get it when button is clicked
			$('#tag-modal .insert-tag').data('target', target);

			// open dialog
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

			// target input where new tag should be inserted
			var target = el.data('target'),
				targetEl = $('.'+target);

			// form values
			var values = $('#tag-modal').find('form').serialize();
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

			$('#tag-modal').modal('hide');
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
			$('#source-modal .insert-source').data('target', target);

			// open dialog
			$('#source-modal').modal('show');
		},

		/**
		 * create new source and insert it into source's select
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'#source-modal .insert-source click' : function(el, ev) {

			ev.preventDefault();

			// target input where new tag should be inserted
			var target = el.data('target'),
				targetEl = $('.'+target);

			// form values
			var values = $('#source-modal').find('form').serialize();
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

			$('#source-modal').modal('hide');
		}
	})
);