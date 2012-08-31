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
		currentControl: null,

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

			//console.log('page set ' + newVal);
			
			// remove all binded events of the current control
			if (this.currentControl) {
				this.currentControl.destroy();
			}
			
			// remove all child nodes
			$("#content").empty();

			// remove highlight (active class) from currently highlighted element
			$('.nav').find('li.active').removeClass('active');
	
			// create new Control based on hash
			switch (newVal) {
				case 'articles':
					this.currentControl = new Articles($("#content"), {});
					$('.nav .articles').addClass('active');
					break;
				case 'dashboard':
					this.currentControl = new Dashboard($("#content"), {});
					$('.nav .dashboard').addClass('active');
					break;
				case 'user':
				default:
					this.currentControl = new Dashboard($("#content"), {});
					$('.nav .dashboard').addClass('active');
					break;
			}
  		}
	})
)
