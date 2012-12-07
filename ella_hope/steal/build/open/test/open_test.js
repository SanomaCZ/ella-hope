// load('steal/build/test/run.js')
/**
 * Tests compressing a very basic page and one that is using steal
 */
load('steal/rhino/rhino.js')
steal('steal/test/test.js', function( s ) {
	STEALPRINT = false;
	s.test.module("steal/build/open")
	
	s.test.test("opens a basic page", function(){
		load('steal/rhino/rhino.js')
		
		steal("steal/build",function(s2){
			
			s2.build.open('steal/build/open/test/basic.html',function(opener){
				s.test.ok(opener,"got opener");
				var items = [];
				opener.each(function( options ){
					items.push(options.src);
				});
			});
			
		});
		s.test.clear();
	});

});