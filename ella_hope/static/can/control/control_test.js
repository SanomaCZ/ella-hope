(function(){
	module("can/control");
var isOpera = /Opera/.test(navigator.userAgent),
	isDojo = (typeof dojo !== "undefined");

// bug in opera/dojo with on/trigger, so skip
// tests binding and unbind, removing event handlers, etc
if(!(isOpera && isDojo)){
	test("basics",  14, function(){
		var clickCount = 0;
		var Things = can.Control({
			"click" : function(){
				clickCount++;
			},
			"span  click" : function(){
				ok(true, "SPAN clicked")
			},
			"{foo} bar" : function(){
				
			}
		})
		var foo = {
			bind : function(event, cb){
				ok(true, "bind called");
				equal(event, "bar");
				ok(cb, "called with a callback")
			},
			unbind : function(event, cb){
				ok(true, "unbind called");
				equal(event, "bar")
				ok(cb, "called with a callback")
			}
		}
		
		can.append( can.$("#qunit-test-area"), "<div id='things'>div<span>span</span></div>")
		var things = new Things("#things",{foo: foo});
		
		
		can.trigger( can.$('#things span'), 'click');
		can.trigger( can.$('#things'), 'click');
		
		equal(clickCount,  2, "click called twice");
		
		things.destroy();
		can.trigger( can.$('#things span'), 'click');
		
		new Things("#things",{foo: foo});
		
		can.remove( can.$('#things') );
	})
}


test("data", function(){
	var Things = can.Control({})
	
	can.append( can.$("#qunit-test-area"), "<div id='things'>div<span>span</span></div>")
	var thing1 = new Things("#things",{});
	var thing2 = new Things("#things",{});
	equals(can.data(can.$('#things'), "controls").length, 2, "there are 2 items in the data array")
	can.remove( can.$('#things') );
})

if( window.jQuery ){
	test("bind to any special", function(){
		jQuery.event.special.crazyEvent = {
			
		}
		var called = false;
		can.Control("WeirdBind",{
			crazyEvent: function() {
				called = true;
			}
		})
		var a = $("<div id='crazy'></div>").appendTo($("#qunit-test-area"))
		new WeirdBind(a);
		a.trigger("crazyEvent")
		ok(called, "heard the trigger");
		
		$("#qunit-test-area").html("")
		
	})
}



test("parameterized actions", function(){
	// YUI does not like non-dom event
	if(can.Y){
		can.Y.mix(can.Y.Node.DOM_EVENTS, {
			sillyEvent: true
		});
	}
	
	
	
	var called = false,
		WeirderBind = can.Control({
			"{parameterized}" : function() {
				called = true;
			}
		}),
		a;
	
	can.append( can.$("#qunit-test-area"), "<div id='crazy'></div>")
	
	a = can.$("#crazy")
	
	new WeirderBind(a, {parameterized: "sillyEvent"});
	
	can.trigger(a, "sillyEvent");

	ok(called, "heard the trigger")
	
	can.remove( a );
})


test("windowresize", function(){
	
	var called = false,
		WindowBind= can.Control("",{
			"{window} resize" : function() {
				called = true;
			}
		})
	
	can.append( can.$("#qunit-test-area"), "<div id='weird'>")
	

	
	new WindowBind("#weird")
	
	can.trigger( can.$(window),'resize')
	ok(called,"got window resize event");
	
	can.remove( can.$("#weird") );
});



// there is a bug in opera with dojo with on/trigger, so skip that case
// can.append( can.$("#qunit-test-area"), "<div id='els'><span id='elspan'><a href='#' id='elsa'>click me</a></span></div>")
// dojo.query("#els span").on("a:click", function(){
	// console.log('HOOLLLLER')
// });
// dojo.query("#els a").trigger("click");
if(!(isOpera && isDojo)){
	test("on", function(){
		var called = false,
			DelegateTest= can.Control({
				click: function() {}
			})
		
		can.append( can.$("#qunit-test-area"), "<div id='els'><span id='elspan'><a href='#' id='elsa'>click me</a></span></div>")
		
		var els = can.$("#els")
		
		var dt = new DelegateTest(els)
		
		
		dt.on(can.$("#els span"), "a", "click", function(){
			called = true;
		})
		
		can.trigger( can.$("#els a"), 'click')
		ok(called, "delegate works")
		can.remove( els )
	});
}


test("inherit", function(){
	var called = false,
		Parent = can.Control({
			click: function(){
				called = true;
			}
		}),
		Child = Parent({});
	
	can.append( can.$("#qunit-test-area"), "<div id='els'><span id='elspan'><a href='#' id='elsa'>click me</a></span></div>")
	
	var els = can.$("#els")

	new Child(els);
	can.trigger( can.$("#els"),'click' )

	ok(called, "inherited the click method")
	
	can.remove(els);
});


test("space makes event",1,function(){
	
	if(can.Y){
		can.Y.mix(can.Y.Node.DOM_EVENTS, {
			foo: true
		});
	}
	
	var Dot = can.Control({
		" foo" : function(){
			ok(true,'called')
		}
	});
	
	can.append( can.$("#qunit-test-area"), "<div id='els'><span id='elspan'><a href='#' id='elsa'>click me</a></span></div>")
	
	var els = can.$("#els")
	
	
	new Dot(els);
	can.trigger( can.$("#els"),'foo' )
	can.remove(els);
})




test("inherit defaults", function() {
    var BASE = can.Control({
        defaults : {
            foo: 'bar'
        }
    }, {});

    var INHERIT = BASE( {
        defaults : {
            newProp : 'newVal'
        }
    }, {});

    ok(INHERIT.defaults.foo === 'bar', 'Class must inherit defaults from the parent class');
    ok(INHERIT.defaults.newProp == 'newVal', 'Class must have own defaults');
	
    var inst = new INHERIT(document.createElement('div'), {});
	
    ok(inst.options.foo === 'bar', 'Instance must inherit defaults from the parent class');
    ok(inst.options.newProp == 'newVal', 'Instance must have defaults of it`s class');
});


var bindable = function(b){
	if(window.jQuery){
		return b;
	} else {
		
	}
	return b
}

test("on rebinding", 2, function(){
	var first = true;
	
	var Rebinder = can.Control({
		"{item} foo" : function(item, ev){
			if(first){
				equals(item.id, 1, "first item");
				first = false;
			} else  {
				equals(item.id, 2, "first item");
			}
		}
	});
	var item1 = bindable({id: 1}),
		item2 = bindable({id: 2}),
		rb = new Rebinder( document.createElement('div'), {item: item1} );
	
	can.trigger(item1, "foo")
	rb.options = {item: item2};
	rb.on();
	can.trigger(item2, "foo")
});

test("actions provide method names", function(){
	var Tester = can.Control({
		"{item1} foo" : "food",
		"{item2} bar" : "food",
		food : function(item, ev, data){
			ok(true, "food called")
			ok(item === item1 || item === item2, "called with an item")
		}
	});
	
	var item1 = {},
		item2 = {}
	rb = new Tester( document.createElement('div'), {item1: item1, item2: item2} );
	
	can.trigger(item1, "foo");
	can.trigger(item2, "bar");
})

})()
