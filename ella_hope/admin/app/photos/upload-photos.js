// file upload - http://jquery.malsup.com/form/
steal(
	'//app/resources/js/file-upload/jquery.form.js'
)
.then(

	PhotosUpload = can.Control(
	/* @static */
	{
		defaults: {
			autosaveInterval: 30 * 1000,	// how ofter is draft automatically saved
			articleStates: ["added", "ready", "approved", "published", "postponed",	"deleted"]
		}
	},
	/* @prototype */
	{
		filelist: null,			// list of selected files for upload

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
				author: Author.findAll()
			} ).then(function( frag ){
				self.element.html(frag);

				// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();
			});

			this.element.slideDown(200);
		},

		/**
		 * when user selects file(s) to upload
		 * @return {[type]} [description]
		 */
		'#file change': function(){

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
					author: Author.findAll()
				} ).then(function( frag ){
					$('#images').append(frag);
				});

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
		 * show image preview before download
		 * @param  {[type]} file [description]
		 * @return {[type]}      [description]
		 */
		showImagePreview: function(file) {

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
				objects[objects.length] = {
					"title": $(this).find('.title').val(),
					"slug": $(this).find('.title').val(),
					"description": $(this).find('.description').val(),
					"width": 256,
					"height": 256,
					"created": new Date().toISOString(),
					"authors" : ["/admin-api/author/101/"],
					"app_data": "{}",
					"image": "attached_object_id:"+$(this).find('.filename').val()
				};

				// if important part is checked, add it to the object
				var importantVal = $(this).find('input[name=important-part]:checked').val();
				if (importantVal) {
					objects[objects.length-1]["important_"+importantVal] = true;
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

		'.photo-save click': function(el, ev) {

			var form = this.element.find('form'),
				values = form.serialize();

			values = can.deparam(values);

			var p = new Photo();
			//a.attr(values).save();
			p.attr(values);
			//console.log(a);
			p.save();

			//console.log(values);

			can.route.attr({page:'photos'}, true);
		},

		'.cancel click' : function(){

			this.clearFileInput();
			can.route.attr({page:'photos'}, true);
		},

		clearFileInput: function() {
			$('#file').replaceWith('<input type="file" id="file" name="attached_object" multiple />');
		}
	})
);