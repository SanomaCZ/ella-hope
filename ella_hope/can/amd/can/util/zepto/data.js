define(['./zepto.1.0rc1'], function () {
	// data.js
	// ---------
	// _jQuery-like data methods._
	var data = {},
		dataAttr = $.fn.data,
		uuid = $.uuid = +new Date(),
		exp = $.expando = 'Zepto' + uuid;

	function getData(node, name) {
		var id = node[exp],
			store = id && data[id];
		return name === undefined ? store || setData(node) : (store && store[name]) || dataAttr.call($(node), name);
	}

	function setData(node, name, value) {
		var id = node[exp] || (node[exp] = ++uuid),
			store = data[id] || (data[id] = {});
		if (name !== undefined) store[name] = value;
		return store;
	};

	$.fn.data = function (name, value) {
		return value === undefined ? this.length == 0 ? undefined : getData(this[0], name) : this.each(function (idx) {
			setData(this, name, $.isFunction(value) ? value.call(this, idx, getData(this, name)) : value);
		});
	};
	$.cleanData = function (elems) {
		for (var i = 0, elem;
		(elem = elems[i]) !== undefined; i++) {
			can.trigger(elem, "destroyed", [], false)
			var id = elem[exp]
			delete data[id];
		}
	}

	return can;
})