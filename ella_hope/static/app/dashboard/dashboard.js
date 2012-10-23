steal(
	//'./css/search_result.css'
)
.then(

	/**
	 * Shows the dashboard.
	 * @tag controllers, home
	 */
	Dashboard = can.Control(
	/* @static */
	{
		defaults: {
			initView : "//app/dashboard/views/init.ejs"
		}
	},
	/* @prototype */
	{
		
		/**
		 * Initializes a new instance of Home container.
		 */
		init: function(element, options){

			this.element.html(can.view(this.options.initView, this.options));
		}
	})
)