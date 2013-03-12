steal(
	'can/view/ejs'
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
			$('body').trigger('navbar-ready');

			// dropdown in menu
			$('.dropdown-toggle').dropdown();
		},

		"{can.route} page set": function( selector, event, newVal, oldVal ) {
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
				case 'photos':
					this.currentControl = new Photos($("#content"), {});
					$('.nav .photos').addClass('active');
					break;
				case 'galleries':
					this.currentControl = new Galleries($("#content"), {});
					$('.nav .galleries').addClass('active');
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
