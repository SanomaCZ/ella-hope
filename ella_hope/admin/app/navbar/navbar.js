steal(
	'./navbar.css'
	, 'can/view/ejs'
)
.then(
	/**
	 * Creates a Navbar controller.
	 *
	 * @tag controllers
	 */
	Navbar = can.Control(
	/* @static */
	{
		defaults: {
			
		}
	},
	/* @prototype */
	{
		/**
		 * Initialize a new instance of the Navbar controller.
		 */
		init : function(el, options){

			this.element.append(can.view('//app/navbar/views/init.ejs', this.options));

			// let the main app.js know that this control is ready
			// necessary for init route listening
			this.element.trigger('navbar-ready');
		},

		/**
		 * router
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		':page route': function( data ) {

			//console.log(data);

    		switch(data.page) {
      			case 'dashborad':
      				var dashboard = new Dashboard($("#content"), {});
      				break;
      			case 'articles':
      				var articles = new Articles($("#content"), {});
      				break;
      			default:
      				var dashboard = new Dashboard($("#content"), {});
      				break;
      		}
  		},

  		/**
  		 * will cache hash: #
  		 * @type {[type]}
  		 */
  		'route': function(data) {
  			//console.log(data);
      	},

      	/**
      	 * setting active/inactive menu items
      	 * @param  {[type]} el [description]
      	 * @param  {[type]} ev [description]
      	 * @return {[type]}    [description]
      	 */
      	'li click': function(el, ev) {
      		// remove active class from old active element
      		el.parent().find('li.active').removeClass('active');
      		// add class to newly clicked element
      		el.addClass('active');
      	}

	})
)
