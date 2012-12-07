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

			var self = this;

			can.view("//app/dashboard/views/init.ejs", {
				articles: Article.findAll({
					limit: 5
					//order_by: '-id' // -<field> means we want descending order
				})
			}).then(function( frag ){
				self.element.html( frag );
			});
		}
	})
);