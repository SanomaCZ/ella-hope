steal(
	'./navbar.css'
	, 'can/view/ejs'
	, 'can/observe/delegate'	// enables listening for specific property in route change
)
.then(
	/**
	 * Creates a Navbar controller. Also used for routing.
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

			this.element.html(can.view('//app/navbar/views/init.ejs', this.options));

			// let the main app.js know that this control is ready
			// necessary for init route listening
			this.element.trigger('navbar-ready');

			// dropdown in menu
			$('.dropdown-toggle').dropdown();
		},

		/**
		 * router
		 * @param  {[type]} data [description]
		 * @return {[type]}      [description]
		 */
		"{can.route} page set": function( selector, event, newVal, oldVal ) {

			console.log('page set ' + newVal);
			
			// remove all binded events and all child nodes
			$("#content").unbind().empty();

			// remove active class from old active element
      		$('.nav').find('li.active').removeClass('active');
	
			switch (newVal) {
				case 'articles':
					var articles = new Articles($("#content"), {});
					$('.nav .articles').addClass('active');
					break;
				case 'dashboard':
					var dashboard = new Dashboard($("#content"), {});
					$('.nav .dashboard').addClass('active');
					break;
				default:
					var dashboard = new Dashboard($("#content"), {});
					$('.nav .dashboard').addClass('active');
					break;
			}
  		}
	})
)
