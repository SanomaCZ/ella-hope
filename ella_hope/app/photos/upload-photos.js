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
			self.element.html(can.view( '//app/photos/views/upload-photos.ejs', {
				photo: this.photo
			}));

			// ajax autocomplete for author
			$.each([$('.authors-photo'), $('.author-default')], function () {
				this.ajaxChosen({
					type: 'GET',
					url: BASE_URL + '/author/?',
					jsonTermKey: 'name__icontains',
					dataType: 'json'
				}, function (data) {

					var results = [];

					$.each(data, function (i, val) {
						results.push({ value: val.resource_uri, text: val.name });
					});

					return results;
				}, {
					"allow_single_deselect": true
				});
			});

				// ajax autocomplete for source
				$('.photo-source').ajaxChosen({
					type: 'GET',
					url: BASE_URL+'/source/?',
					jsonTermKey: 'name__icontains',
					dataType: 'json'
				}, function (data) {

					var results = [];

					$.each(data, function (i, val) {
						results.push({ value: val.resource_uri, text: val.name });
					});

					return results;
				}, {
					"allow_single_deselect": true
				});

				// ajax autocomplete for tags
				$('.photo-tags').ajaxChosen({
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
				}, {
					"allow_single_deselect": true
				});

				var jcropOptions = self.options.jcropOptions;

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

			this.element.slideDown(200);
		},

		'#file change': function(){
			this.fileChange();
		},

		/**
		 * get coordinates from Jcrop and update form fields
		 * @param  {[type]} element [description]
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

			var j = 0;
			var f = function() {
				setTimeout(function(){
					if (j < nFiles) {
						self.createNewImage(files[j], defs);
						f();
						j++;
					}
					else {
						self.applyDefaultValues();
					}
				}, 1000);
			};

			var defs = {};

			self.getDefaultAuthor(function(instance) {
				defs.author = instance;
				f();
			})
		},

		getDefaultAuthor: function (cb) {
			var val = $(".author-default").val();
			var id = val && val.match(/\/(\d+)\/$/);
			if (!id) {
				cb();
				return null;
			}

			return Author.findOne({id: id[1]}, cb);
		},

		/**
		 * apply chosen select and default values
		 * @return {[type]} [description]
		 */
		applyDefaultValues: function() {

			var $defaults = $('.defaults'),
				$images = $('#images');

			// get default values
			var defaultTitle = $defaults.find('input[name=default_title]').val();
			var defaultDescription = $defaults.find('input[name=default_description]').val();

			// set default values
			if (defaultTitle) {
				$images.find('input[name=title]').val(defaultTitle);
			}
			if (defaultDescription) {
				$images.find('textarea[name=description]').val(defaultDescription);
			}

			// if filename should be used as default value for any field
			var filenameDefault = $defaults.find('select[name=filename_default]').val();
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
		},

		/**
		 * create container for each image
		 * @param  {[type]} file [description]
		 * @return {[type]}      [description]
		 */
		createNewImage: function(file, defaults) {
			defaults = defaults || {};
			// append new image
			// with .find(':last') we can get lastly appended element
			// we need to do this because ajaxChosen needs to be initialized on each input separately
			var image = $('#images').append(can.view('//app/photos/views/photo.ejs', {
				file: file,
				photo: {},
				author: [defaults.author]
			})).find(':last');

			// get uploaded image div
			var uploadImage = $(image.closest('.modal').prevAll('.upload-image').eq(0));

			// ajax autocomplete for author
			uploadImage.find('.authors-photo').ajaxChosen({
				type: 'GET',
				url: BASE_URL+'/author/?',
				jsonTermKey: 'name__icontains',
				dataType: 'json'
			}, function (data) {

				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.resource_uri, text: val.name });
				});

				return results;
			});

			// ajax autocomplete for source
			uploadImage.find('.photo-source').ajaxChosen({
				type: 'GET',
				url: BASE_URL+'/source/?',
				jsonTermKey: 'name__icontains',
				dataType: 'json'
			}, function (data) {

				var results = [];

				$.each(data, function (i, val) {
					results.push({ value: val.resource_uri, text: val.name });
				});

				return results;
			});

			// ajax autocomplete for tags
			uploadImage.find('.photo-tags').ajaxChosen({
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

			// show image next to form
			this.showImagePreview(file);
		},

		/**
		 * show image preview before upload
		 * enables crop
		 * @param  {[type]} file [description]
		 * @return {[type]}      [description]
		 */
		showImagePreview: function(file) {

			var self = this;

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
			}, 1000);
		},

		// bind to the form's submit event
		'.uploadForm submit': function(el, ev) {

			var self = this;
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

				var source = $(this).find('.photo-source').val();
				source = source ? source : null;

				var title = encodeURIComponent($(this).find('.title').val());

				objects[objects.length] = {
					"title": title,
					"slug": title,
					"description": encodeURIComponent($(this).find('.description').val()),
					"created": new Date().toISOString(),
					"authors" : $(this).find('.authors-photo').val(),
					"app_data": null,
					"image": "attached_object_id:"+$(this).find('.filename').val(),
					"important_top": important_top,
					"important_left": important_left,
					"important_bottom": important_bottom,
					"important_right": important_right,
					"rotate": parseInt($(this).find('input[name=rotate]').val(), 10)
				};

				var tags = $(this).find('.photo-tags').val();
				if (tags) {
					objects[objects.length - 1].tags = tags;
				}

				if (source) {
					objects[objects.length - 1].source = source;
				}
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

					// remove all error markup
					$('.uploadForm .control-group').removeClass('error');
					$('.uploadForm .help-inline').empty();
					$('.response_msg').removeClass('alert-error').hide();

					// create model from each photo so that it can be validated
					for (var i = 0; i < objects.length; i++) {

						// create model from photo attributes
						var photo = new Photo(objects[i]);

						// check if there are any errors
						var errors = photo.errors();

						// there are no errors
						if (errors === null) {
							//console.log('no errors');
							return true;
						}
						else {

							$('.response_msg')
								.show()
								.addClass('alert-error')
								.find('span').html($.t('<strong>Stop!</strong> There were some errors. Try to correct them.'));

							self.showErrors(errors);
							return false;
						}
					}
					// return false to cancel submit
					return false;
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
		 * highlight inputs with error
		 * @param  {[type]} errors [description]
		 * @return {[type]}        [description]
		 */
		showErrors: function(errors) {

			if (errors && errors !== true) {
				$.each(errors, function(e){
					$('.uploadForm').find('.'+e).each(function(i, input){
						if (!$(input).val()) {
							$(input).closest('.control-group')
								.addClass('error')
								.find('.help-inline').html(errors[e][0]);
						}
					});
				});

				// scroll to first error
				// there were occasional errors where element could not be found
				if ($('.uploadForm .control-group.error').eq(0).length) {
					$('html, body').animate({
						scrollTop: $('.uploadForm .control-group.error').eq(0).offset().top - 50
					}, 500);
				}
			}
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

			// these values are from form - they contain some useless fields
			// which should not be sent to the server
			values = can.deparam(values);

			// values which we want to send to the server
			var properValues = {};

			// which photo id we want to patch
			properValues.id = values.id;

			// do not send rotate parameter if photo is not rotated
			if (values.rotate !== '0') {
				properValues.rotate = values.rotate;
			}

			properValues.title = values.title;
			properValues.authors = values.authors;
			properValues.description = values.description;
			//properValues.name = values.name;
			properValues.slug = values.slug;
			properValues.tags = values.tags;
			//properValues.url = values.url;

			// app_data is required for django, can be set to null but must be there
			properValues.app_data = values.app_data || null;

			// convert crop coordinates from preview image size to original image size
			if (values.important_top && values.important_left &&
				values.important_bottom && values.important_right) {
				properValues.important_top = Math.round(values.important_top);
				properValues.important_left = Math.round(values.important_left);
				properValues.important_bottom = Math.round(values.important_bottom);
				properValues.important_right = Math.round(values.important_right);
			}

			// source is not required, but it should not be sent if it's empty
			if (values.source) {
				properValues.source = values.source;
			}

			var p = new Photo();
			p.attr(properValues);

			// check for errors
			var errors = p.errors();

			if (errors === null) {
				// save photo
				p.save();
				// return to photos list
				can.route.attr({page:'photos'}, true);
			}
			else {
				this.showErrors(errors);
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

			if (rotation === 0 || rotation === 180) {

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

		'.cancel-upload click' : function(){

			this.clearFileInput();
			can.route.attr({page:'photos'}, true);
		},

		clearFileInput: function() {
			$('#file').replaceWith('<input type="file" id="file" name="attached_object" multiple />');
		},

		/**
		 * open a dialog where new author can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-author-photos click' : function(el, ev) {

			ev.preventDefault();
			$('.author-modal-photos').modal('show');
		},

		/**
		 * generate slug from author name
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.author-modal-photos .slug-from-name click' : function(el, ev) {

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
		'.author-modal-photos .insert-author click' : function(el, ev) {

			ev.preventDefault();

			// form values
			var values = $('.author-modal-photos').find('form').serialize();
			values = can.deparam(values);

			// create new author
			var author = new Author();
			author.attr(values);
			author.save(function(data){
				$('.authors-photo')
					// append new author to authors list and make it selected
					.append('<option value="'+data.resource_uri+'" selected="selected">'+data.name+'</option>')
					// update chosen select
					.trigger('liszt:updated')
					;
			});

			$('.author-modal-photos').modal('hide');
		},

		/**
		 * open a dialog where new tag can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-tag-photos click' : function(el, ev) {

			ev.preventDefault();

			// get target element where new tag should be inserted
			var target = el.data('target');

			// save target to insert-tag button so that
			// we can get it when button is clicked
			$('.tag-modal-photos .insert-tag').data('target', target);

			// open dialog
			$('.tag-modal-photos').modal('show');
		},

		/**
		 * generate slug from tag name
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.tag-modal-photos .slug-from-name click' : function(el, ev) {

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
		'.tag-modal-photos .insert-tag click' : function(el, ev) {

			ev.preventDefault();

			// target input where new tag should be inserted
			var target = el.data('target'),
				targetEl = $('.'+target);

			// form values
			var values = $('.tag-modal-photos').find('form').serialize();
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

			$('.tag-modal-photos').modal('hide');
		},

		'.tag-modal-photos .close-tag click' : function(el, ev) {
			ev.preventDefault();
			$('.tag-modal-photos').modal('hide');
		},

		/**
		 * open a dialog where new source can be added
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.add-source-photos click' : function(el, ev) {

			ev.preventDefault();

			// get target element where new source should be inserted
			var target = el.data('target');

			// save target to insert-source button so that
			// we can get it when button is clicked
			$('.source-modal-photos .insert-source').data('target', target);

			// open dialog
			$('.source-modal-photos').modal('show');
		},

		/**
		 * create new source and insert it into source's select
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.source-modal-photos .insert-source click' : function(el, ev) {

			ev.preventDefault();

			// target input where new tag should be inserted
			var target = el.data('target'),
				targetEl = $('.'+target);

			// form values
			var values = $('.source-modal-photos').find('form').serialize();
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

			$('.source-modal-photos').modal('hide');
		},

		/**
		 * close dialog without adding new source
		 * @param  {[type]} el [description]
		 * @param  {[type]} ev [description]
		 * @return {[type]}    [description]
		 */
		'.source-modal-photos .close-source click' : function(el, ev) {
			ev.preventDefault();
			$('.source-modal-photos').modal('hide');
		}
	})
);
