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

			this.filelist = new can.Observe({
				count: 0,
				files: []
			});

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
				filelist: this.filelist,
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
			
			var files = document.getElementById("file").files,
      		nFiles = files.length;

      		// hide message box from previous upload
      		$('.response_msg').hide();

      		// add selected files to observe se that it can be rendered
      		for (var i = 0; i < files.length; i++) {
      			this.filelist.files.push(files[i]);
      		}

      		// wait till html elements are rendered
      		// show image thumbnails
      		// needs to be done here, because when added to observe,
      		// type is converted from File to Construct and previews are impossible
      		setTimeout(function(){
      			for (var i = 0; i < files.length; i++) {
	      			var file = files[i];
				    var imageType = /image.*/;
				     
				    if (!file.type.match(imageType)) {
				      continue;
				    }
				     
				    var img = document.createElement("img");
				    img.classList.add("obj");
				    img.file = file;
				    document.getElementById("preview-"+i).appendChild(img);
				     
				    var reader = new FileReader();
				    reader.onload = (function(aImg) { return function(e) { aImg.src = e.target.result; }; })(img);
				    reader.readAsDataURL(file);
				}
      		}, 200);

      		// wait till all images a rendered so we can apply chosen select
      		setTimeout(function(){
      			// enable chosen select for authors
				// http://harvesthq.github.com/chosen/
				$('.chzn-select').chosen();
      		}, 1000);

		},

		// bind to the form's submit event 
	    '.uploadForm submit': function(el, ev) {

	    	el.find('.progress').show();
	    	el.find('.progress .bar').css('width', '0px');

	    	var form = el,//.parent('form'),
				values = form.serialize(),
				values = can.deparam(values);

	    	// prepare Options Object 
			var options = {
			    url: BASE_URL + '/photo/?username='+USER.attr('username')+'&api_key='+USER.attr('api_key'), 
			    //url: 'http://localhost/test.php',
			    data: {
			    	photo: JSON.stringify({
			    		"app_data": "{}", 
			    		"created": new Date().toISOString(),
			    		"description": values.description, 
			    		"image": null, 
			    		"height": 256, 
			    		"authors" : ["/admin-api/author/101/"],
			    		"important_bottom": null, 
			    		"important_left": null, 
			    		"important_right": null, 
			    		"important_top": null, 
			    		"title": values.title, 
			    		"width": 256
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
			    		$('#file').val('');
			    		$('.upload-image').remove();
			    	}, 500);
			    	$('.response_msg')
						.show()
						.addClass('alert-success')
						.find('span').html($.t('<strong>Well done!</strong> Photo uploaded.'));
			    },
			    error: function() {
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

	    '.save click': function(el, ev) {

			var form = this.element.find('form'),
				values = form.serialize(),
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

			can.route.attr({page:'photos'}, true);
		}
	})
)