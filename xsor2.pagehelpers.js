// todo: change all the inline event handlers in the html to addEventListeners
// in xsor.pagehelpers.init()

xsor.pagehelpers = {
	changeCount: function() {
		var temp = document.getElementById("minimum_actor_instances");
		if (!temp) return;
		var temp2 = document.location.href.lastIndexOf('?');
		if (isNaN(temp2)) temp2 = document.location.href.length;
		temp2 = document.location.href.substr(0, temp2);
		document.location.href = temp2 + "?minimum_actor_instances=" + temp.value;
	},
	
	// temp hack: turn debug mode on and off.
	toggleDebug: function() {
		var temp = document.getElementById("debug");
		var xlib = window.xlib;
		xlib.debug = temp.checked ? 1 : 0;
	},
	
	// temp hack: switches the canvas between native and double size using CSS.
	// While this causes the browsers to apply a bilinear/bicubic filter when
	// scaling (identical to the method below) the framerate loss is only
	// significant in Opera 11 and below. Firefox also has a CSS property that
	// disables the filter and enables nearest-neighbour instead.
	toggleCanvasSizeCSS: function() {
		var canvas = document.getElementById("surface");
		var scale = document.getElementById("scale");
		if (scale.checked) {
			// double size
			canvas.style.width = "1024px";
			canvas.style.height = "480px";
		}
		else {
			// native size
			canvas.style.width = "512px";
			canvas.style.height = "240px";
		}
	},

	// temp hack: switches the canvas between native and double size.
	// Currently unused because the browsers automatically apply a very slow
	// bilinear/bicubic filter when scaling an image passed to drawImage(),
	// and only Firefox has a property to enable nearest-neighbour instead.
	//
	toggleCanvasSize: function() {
		var canvas = document.getElementById("surface");
		var scale = document.getElementById("scale");
		if (scale.checked) {
			// double size
			xsor.pause = true;
			canvas.width = "1024";
			canvas.height = "480";
			xlib.drawScaleX = 2;
			xlib.drawScaleY = 2;
			xsor.pause = false;
		}
		else {
			// native size
			xsor.pause = true;
			canvas.width = "512";
			canvas.height = "240";
			xlib.drawScaleX = 1;
			xlib.drawScaleY = 1;
			xsor.pause = false;
		}
	},
	
	// stuff to get the party started
	init: function() {
		xsor.init(document.getElementById("surface"));
		xsor.pagehelpers.toggleDebug();
		xsor.pagehelpers.toggleCanvasSizeCSS();
	}
}