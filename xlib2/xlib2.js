// The original author of this code is Andrew Stibbard at http://xhva.net
// (xhva.net@gmail.com), copyright 2012 except where noted.
// You are hereby granted a licence to copy, extend and produce derivative
// works based upon this code for non-commercial purposes as long as this
// notice is reproduced in plain sight inside the derivative file or project.
// For commercial use please contact Andrew at the above address.

// Questions? Improvements? Contact me: http://xhva.net/work or xhva.net@gmail.com .
// Cheers!

// todo: Opera 10 bugs (are they bugs in the browser?)
//  - down arrow gets stuck (keyTable.down) when using an input field as the
//    capture element.
//  - input field still receives and adds the character to the text, even with
//    stopProp() and preventDef() called on the event

// todo: convert many properties here to JS getter/setter syntax. Beware
// performance pitfalls:
// https://bugzilla.mozilla.org/show_bug.cgi?id=626021
// http://labs.transloc.com/?p=21
// http://jsperf.com/es5-getters-setters-versus-getter-setter-methods/4
// http://code.google.com/p/v8/issues/detail?id=1239

// todo: audit 'this' usage and make direct object references where possible

// todo: audio null assignments and testing. Make them undefined instead.

// todo: should imageStore have a function to create mipmaps? These could be
// used when drawing scaled images to reduce the stretching calculations the
// browser performs

// todo: convert methods/properties beginning with underscore to real privates
// http://www.crockford.com/javascript/private.html

// todo: audit flipAxis/axisFlip and make consistent.

// todo: reduce usage of local var references to simple this.whatever values.

// emulate ES5's object.create for easy prototypal inheritance.
// http://javascript.crockford.com/prototypal.html
// http://stackoverflow.com/questions/122102/what-is-the-most-efficient-way-to-clone-a-javascript-object#answer-3873968
// This function creates a new object using the passed object as its prototype.
// Be careful to pass an instantiated object, not a constructor function.
if (typeof Object.create !== 'function') {
    Object.create = function(o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}

// Emulate the .isArray method from ES5.
// https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Array/isArray#Compatibility
if (!Array.isArray) {
	Array.isArray = function (vArg) {
		return Object.prototype.toString.call(vArg) === "[object Array]";
	};
}

// emulate ES5 getter/setter API using legacy APIs
// http://blogs.msdn.com/b/ie/archive/2010/09/07/transitioning-existing-code-to-the-es5-getter-setter-apis.aspx
if (Object.prototype.__defineGetter__ && !Object.defineProperty) {
   Object.defineProperty = function(obj, prop, desc) {
      if ("get" in desc) {
				obj.__defineGetter__(prop, desc.get);
      }
      if ("set" in desc) {
				obj.__defineSetter__(prop, desc.set);
      }
   };
}

// function to test whether an object is empty. An empty object is created when
// a constructor function runs but returns false because of an error.
// http://www.webdeveloper.com/forum/showthread.php?t=193474
// todo: change constructor functions to always return a new object regardless
// of 'new' usage. Rename them to have a leading capital.
if (typeof Object.isEmpty !== 'function') {
	Object.isEmpty = function(o) {
		var p;
		for (p in o) {
			if (o.hasOwnProperty(p)) {
				return false;
			}
		}
		return true;
	};
}

// requestAnimationFrame wrapper by Paul Irish. Thanks!
// http://paulirish.com/2011/requestanimationframe-for-smart-animating/
window.requestAnimFrame = (function() {
	return window.requestAnimationFrame ||
	       window.webkitRequestAnimationFrame ||
	       window.mozRequestAnimationFrame ||
	       window.oRequestAnimationFrame ||
	       window.msRequestAnimationFrame ||
	       false;
})();

// thanks to jQuery for teaching me this
(function(){

// general format:
//  - objects and non-constructor functions are written inside the original
//    parent object declaration.
//  - contructor functions are written just after their parent object and
//    followed by their prototype assignments.

var
window = this,
undefined,

// todo: rename this horrible global var
xlib = window.xlib = {

	STATEEVENTTYPE_ENTER: 0,
	STATEEVENTTYPE_LEAVE: 1,
	
	// todo: more of these
	// todo: replace magic numbers in state machines with these, but will they be
	// slow to lookup?
	STATEID_MOVEUP: 1,
	STATEID_MOVEUPRIGHT: 2,
	STATEID_MOVERIGHT: 3,
	STATEID_MOVEDOWNRIGHT: 4,
	STATEID_MOVEDOWN: 5,
	STATEID_MOVEDOWNLEFT: 6,
	STATEID_MOVELEFT: 7,
	STATEID_MOVEUPLEFT: 8,
	STATEID_GETHITGROUND: 20,
	STATEID_GETHITAIR: 21,
	STATEID_GETHITKNOCKDOWN: 22,
	STATEID_JUMPSTILL: 10,
	// todo: use the same clockwise order of directions as the _MOVE* constants
	STATEID_JUMPLEFT: 11,
	STATEID_JUMPIN: 13,
	STATEID_JUMPOUT: 14,
	STATEID_JUMPINLEFT: 15,
	STATEID_JUMPINRIGHT: 16,
	STATEID_JUMPOUTLEFT: 17,
	STATEID_JUMPOUTRIGHT: 18,
	STATEID_LAND: 10.03,

	// todo: using 0 for right here is stupid, and it assumes that we always want
	// right to be a valid direction.
	INSTANCEDIRECTION_RIGHT: 0x0,
	INSTANCEDIRECTION_LEFT: 0x1,
	INSTANCEDIRECTION_DOWN: 0x2,
	INSTANCEDIRECTION_UP: 0x4,

	// scale used for drawing
	drawScaleX: 1,
	drawScaleY: 1,

	// debug level. 0 is off, 1 is normal, 2 is verbose, 3 is ridiculous.
	debug: 0,

	// current game tick, updated every frame from the app js.
	gameTick: 0,

	getRandomHexColour: function() {
		// each component is calculated separately, converted to hex, padded if necessary then concatenated.
		var red = Math.floor(Math.random() * 255).toString(16);
		if (red.length === 1) {
			red = "0" + red;
		}
		var green = Math.floor(Math.random() * 255).toString(16);
		if (green.length === 1) {
			green = "0" + green;
		}
		var blue = Math.floor(Math.random() * 255).toString(16);
		if (blue.length === 1) {
			blue = "0" + blue;
		}
		return "#" + red + green + blue;
	},

	// wrapper for console.log so we don't have to do typeof every time
	log: function() {
		if (typeof console === 'undefined') return false;
		// https://developer.mozilla.org/en/Core_JavaScript_1.5_Reference/Global_Objects/Function/apply
		// nice, but this gives a type error in Chrome:
		//   console.log.apply(this, arguments)
		// this works:
		//   console.log( Array.prototype.slice.call(arguments) );
		// but wraps all output with an array (fugly).
		switch (arguments.length) {
			case 1:
				console.log(arguments[0]);
				break;
			case 2:
				console.log(arguments[0], arguments[1]);
				break;
			case 3:
				console.log(arguments[0], arguments[1], arguments[2]);
				break;
			case 4:
				console.log(arguments[0], arguments[1], arguments[2], arguments[3]);
				break;
			default:
		}
		return true;
	},

	drawTextBlockTop: function(context, font, x, y) {
		// why does fillText ignore newlines? Bah.
		// https://developer.mozilla.org/en/JavaScript/Reference/functions_and_function_scope/arguments
		var args = Array.prototype.slice.call(arguments).slice(4);
		var i;
		//save
		var existingFillStyle = context.fillStyle;
		var existingFont = context.font;
		//draw
		context.font = font;
		context.fillStyle = "white";
		for (i = 0; i < args.length; i++) {
			context.fillText(args[i], x, y + 9 + (i * 9)); // todo: determine px font size somehow and use for line height
		}
		// restore
		context.fillStyle = existingFillStyle;
		context.font = existingFont;
	},

	// rectangle intersection testing
	// returns true if overlap
	// thanks to http://tekpool.wordpress.com/2006/10/11/rectangle-intersection-determine-if-two-given-rectangles-intersect-each-other-or-not/
	rectIntersect: function(x1,y1,w1,h1, x2,y2,w2,h2) {
		return !(x2 > x1 + w1 ||
		         x2 + w2 < x1 ||
		         y2 > y1 + h1 ||
		         y2 + h2 < y1);
	},

	// returns the overlapping rectangle as points, or false if there is no overlap.
	// thanks to http://www.gamedev.net/topic/298689-rectangle-intersection/
	rectOverlap: function(x1,y1,w1,h1, x2,y2,w2,h2) {
		if((x2 > x1 + w1 ||
		    x2 + w2 < x1 ||
		    y2 > y1 + h1 ||
		    y2 + h2 < y1)) return false;
		return {
	         x: Math.max(x1, x2),
	         y: Math.max(y1, y2),
	         w: Math.min(x1 + w1, x2 + w2) - Math.max(x1, x2),
	         h: Math.min(y1 + h1, y2 + h2) - Math.max(y1, y2)
	       };
	},
	
	//+ Jonas Raoni Soares Silva
	//@ http://jsfromhell.com/math/is-point-in-poly [rev. #0]
	// small edits for speedup; see http://jsperf.com/ispointinpath-boundary-test-speed
	isPointInPolygon: function(coords, x, y){
		// coords is an array of x,y coords in the format:
		//   [ [x,y], [x,y], ... ]
		var l = coords.length;
		if (l < 3) {
			xlib.log("Error:    xlib.isPointInPoly() given coordinate array containing less than 3 sets of x,y coords.");
			return false;
		}
		for(var c = false, i = -1, j = l - 1; ++i < l; j = i)
			((coords[i][1] <= y && y < coords[j][1]) || (coords[j][1] <= y && y < coords[i][1]))
			&& (x < (coords[j][0] - coords[i][0]) * (y - coords[i][1]) / (coords[j][1] - coords[i][1]) + coords[i][0])
			&& (c = !c);
		return c;
	},
	
	// returns whether a point is inside an AABB rectangle.
	isPointInAABB: function(rect, x, y) {
		if (rect.length) {
			// array [x, y, w, h]
			return (x >= rect[0] && x <= rect[0] + rect[2] && y >= rect[1] && y <= rect[1] + rect[3]);
		}
		else {
			// object		
			return (x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h);
		}
	},
	
	// returns true if the a line with endpoints (x1,y1) and (x2,y2) intersects
	// a axis-aligned rectangle with points (x1,y1, w,h).
	// Both parameters are objects containing the above props.
	intersectLineAABB: function(line, aabb) {
		// is line left of the aabb?
		if (line.x1 < aabb.x && line.x2 < aabb.x) {
			return false;
		}
		// is line above the aabb?
		if (line.y1 < aabb.y && line.y2 < aabb.y) {
			return false;
		}
		// opt
		var aabbx2 = aabb.x + aabb.w;
		var aabby2 = aabb.h + aabb.h;
		// is line right of aabb?
		if (line.x1 > aabbx2 && line.x2 > aabbx2) {
			return false;
		}
		// is line below aabb?
		if (line.y1 > aabby2 && line.y2 > aabby2) {
			return false;
		}
	
		var r = 0;
	
		// top edge - find x where the line crosses the top edge
		// ((distance from line top to aabb top / total line height) * total line width) + line left edge
		r = (((aabb.y - line.y1) / (line.y2 - line.y1)) * (line.x2 - line.x1)) + line.x1;
		if (r >= aabb.x || r <= aabbx2) {
			return true;
		}
		
		// bottom edge - find x where the line crosses the bottom edge
		r = (((aabby2 - line.y1) / (line.y2 - line.y1)) * (line.x2 - line.x1)) + line.x1;
		if (r >= aabb.x || r <= aabbx2) {
			return true;
		}
	
		// left edge - find y where the line crosses the left edge
		r = (((aabb.x - line.x1) / (line.x2 - line.x1)) * (line.y2 - line.y1)) + line.y1;
		if (r >= aabb.y || r <= aabby2) {
			return true;
		}
	
		// no need to check right edge since we're looking for a line that passes
		// through the rectangle. It will pass through two of the edges.
		xlib.log("Error:    xlib.intersectLineAABB() got to end of function without returning success or failure.");
	},
	
	getIntersectLineLine: function(x1, y1, x2, y2, x3, y3, x4, y4, arrayResult, fast) {
	
		// adapted from Olaf Rabbachin's adaptation of Paul Bourke's line
		// intersection code available at http://paulbourke.net/geometry/lineline2d/
		// Thanks!
	
		// Denominator for ua and ub are the same, so store this calculation
		var d = (y4 - y3) * (x2 - x1) - (x4 - x3) * (y2 - y1);
		
		// n_a and n_b are calculated as seperate values for readability
		var n_a = (x4 - x3) * (y1 - y3) - (y4 - y3) * (x1 - x3);
		var n_b = (x2 - x1) * (y1 - y3) - (y2 - y1) * (x1 - x3);
		
		// Make sure there is not a division by zero - this also indicates that
		// the lines are parallel.  
		// If n_a and n_b were both equal to zero the lines would be on top of each 
		// other (coincidental).  This check is not done because it is not 
		// necessary for this implementation (the parallel check accounts for this).
		if (d === 0) return false;
		
		// Calculate the intermediate fractional point that the lines potentially intersect.
		var ua = n_a / d;
		var ub = n_b / d;
		
		// The fractional point will be between 0 and 1 inclusive if the lines
		// intersect.  If the fractional calculation is larger than 1 or smaller
		// than 0 the lines would need to be longer to intersect.
		if (ua >= 0 && ua <= 1 && ub >= 0 && ub <= 1) {
			if (arrayResult) {
				arrayResult[0] = ua; // fraction of first line intersection
				arrayResult[1] = ub; // fraction of second line intersection
				arrayResult[2] = x1 + (ua * (x2 - x1)); // point of x intersection
				arrayResult[3] = y1 + (ua * (y2 - y1)); // point of y intersection
			}
			return true;
		}
		
		return false;
	
	},
	
	// returns true if the axis-aligned bounding box is completely within the
	// provided polygon. Formats:
	//   poly [ [x,y], [x,y], [x,y], ...]
	//   aabb { x, y, w, h }
	isAABBInPolygon: function(poly, aabb) {
		var
			p = poly,
			l = p.length,
			// minus one because of how we step through polygon points in second loop
			i = l - 1,
			lineX2, lineY2,
			r,
			c;

		// check that each aabb point is inside the poly first
		if (!this.isPointInside(aabb.x, aabb.y)) return false;
		if (!this.isPointInside(aabb.x + aabb.w, aabb.y)) return false;
		if (!this.isPointInside(aabb.x + aabb.w, aabb.y + aabb.h)) return false;
		if (!this.isPointInside(aabb.x, aabb.y + aabb.h)) return false;

		// now test each line in the poly to see whether it intersects the aabb edges
		while (i--) {

			// check if the current vertex is inside the aabb
			if (p[i][0] >= aabb.x && p[i][0] <= aabb.x + aabb.w && p[i][1] >= aabb.y && p[i][1] <= aabb.y + aabb.h) return false;

			// avoid addition each time we use the second vertex
			lineX2 = p[i + 1][0];
			lineY2 = p[i + 1][1];

			// is line left of the aabb?
			if (p[i][0] < aabb.x && lineX2 < aabb.x) continue;
			// is line above the aabb?
			if (p[i][1] < aabb.y && lineY2 < aabb.y) continue;
			// opt
			var aabbx2 = aabb.x + aabb.w;
			var aabby2 = aabb.h + aabb.h;
			// is line right of aabb?
			if (p[i][0] > aabbx2 && lineX2 > aabbx2) continue;
			// is line below aabb?
			if (p[i][1] > aabby2 && lineY2 > aabby2) continue;
		
			// top edge - find x where the line crosses the top edge
			// ((distance from line top to aabb top / total line height) * total line width) + line left edge
			r = (((aabb.y - p[i][1]) / (lineY2 - p[i][1])) * (lineX2 - p[i][0])) + p[i][0];
			if (r >= aabb.x || r <= aabbx2) return false;
			// bottom edge - find x where the line crosses the bottom edge
			r = (((aabby2 - p[i][1]) / (lineY2 - p[i][1])) * (lineX2 - p[i][0])) + p[i][0];
			if (r >= aabb.x || r <= aabbx2) return false;
			// left edge - find y where the line crosses the left edge
			r = (((aabb.x - p[i][0]) / (lineX2 - p[i][0])) * (lineY2 - p[i][1])) + p[i][1];
			if (r >= aabb.y || r <= aabby2) return false;
		}
	
		// no need to check right edge since we're looking for a line that passes
		// through the rectangle. It will pass through two of the edges.
		return true;
	}
};

// generic caching structure to hold data and timestamp of last usage.
xlib.cache = function(timeout) {
	this.data = [];
	this.timestamps = [];
	// timeout used for pruning. If any items in the cache are found with a
	// timestamp older than this value, then they're cleared. Defaults to 5 sec.
	this.timeout = parseFloat(timeout) || 5000;
	this._lastPruneTimestamp = Date.now();
};
// fetch an item from the cache
xlib.cache.prototype.getItem = function(index) {
	if (this.timestamps[index]) {
		this.timestamps[index] = Date.now();
		if (xlib.debug > 1) console.log("Cache:    found and returned entry");
		return this.data[index];
	}
};
// set a new item in the cache
xlib.cache.prototype.setItem = function(index, data) {
	this.timestamps[index] = Date.now();
	this.data[index] = data;
	return data;
};
// helper to prune the cache of data that hasn't been accessed for a while.
xlib.cache.prototype.prune = function() {
	var	now = Date.now();
	// don't run the prune every time it's called -- run it every 2 seconds.
	if (now - this._lastPruneTimestamp < 2000) return false;
	var
		len = this.timestamps.length,
		i = 0;
	// todo: replace with better array search
	for (i = 0; i < len; i++) {
		if (this.timestamps[i] && now - this.timestamps[i] > this.timeout) {
			this.data[i] = undefined;
			this.timestamps[i] = 0;
			if (xlib.debug > 1) console.log("Cache:    removed entry");
		}
	}
	this._lastPruneTimestamp = now;
	return true;
}
// helper to reset the cache to factory defaults.
xlib.cache.prototype.clear = function() {
	this.data = [];
	this.timestamps = [];
}

// object used for 2D boundary information.
// todo: rename this to aabb, along with 3d ver
xlib.boundingBox2D = function(x, y, w, h) {
	// constraints: numbers must be positive
	// if (x < 0 || y < 0 || w < 0 || h < 0) return false;
	// constraints: none
	this.x = x;
	this.y = y;
	this.w = w;
	this.h = h;
};
// returns true if there's an overlap with another boundingBox2D.
xlib.boundingBox2D.prototype.intersect = function(bb2D) {
	return !(bb2D.x > this.x + this.w ||
	         bb2D.x + bb2D.w < this.x ||
	         bb2D.y > this.y + this.h ||
	         bb2D.y + bb2D.h < this.y);
};
// tests for overlaps against an array of other boundingBox2D objects.
// Returns an array containing the objects with which overlap was detected.
xlib.boundingBox2D.prototype.intersectArray = function(bb2DArray) {
	if (!bb2DArray.length) return false;
	var found = [];
	var i = bb2DArray.length;
	while (i--) {
		if (bb2DArray[i].x > this.x + this.w ||
	      bb2DArray[i].x + bb2DArray[i].w < this.x ||
	      bb2DArray[i].y > this.y + this.h ||
	      bb2DArray[i].y + bb2DArray[i].h < this.y) continue;
		found.push(bb2DArray[i]);
	}
	return found;
};
// returns the overlapping rectangle as points, or false if there's no overlap.
xlib.boundingBox2D.prototype.overlap = function(bb2D) {
	if (bb2D.x > this.x + this.w ||
	    bb2D.x + bb2D.w < this.x ||
	    bb2D.y > this.y + this.h ||
	    bb2D.y + bb2D.h < this.y) return false;
	// return Rect(max(left, other.left), max(top, other.top), min(right, other.right), min(bottom, other.bottom));
	return new xlib.boundingBox2D(Math.max(this.x, bb2D.x),
	                              Math.max(this.y, bb2D.y),
	                              Math.min(this.x + this.w, bb2D.x + bb2D.w) - Math.max(this.x, bb2D.x),
	                              Math.min(this.y + this.h, bb2D.y + bb2D.h) - Math.max(this.y, bb2D.y));
};
// tests for overlaps against an array of other boundingBox2D objects.
// Returns a two-dimensional array containing the objects with which overlap was
// detected along with a new bounding box with the coordinates of the overlap.
xlib.boundingBox2D.prototype.overlapArray = function(bb2DArray) {
	if (!bb2DArray.length) return false;
	var found = [];
	var i = bb2DArray.length;
	while (i--) {
		if (bb2DArray[i].x > this.x + this.w ||
		    bb2DArray[i].x + bb2DArray[i].w < this.x ||
		    bb2DArray[i].y > this.y + this.h ||
		    bb2DArray[i].y + bb2DArray[i].h < this.y) continue;
		found.push(bb2DArray[i], new xlib.boundingBox2D(Math.max(this.x, bb2DArray[i].x),
		                                                     Math.max(this.y, bb2DArray[i].y),
		                                                     Math.min(this.x + this.w, bb2DArray[i].x + bb2DArray[i].w) - Math.max(this.x, bb2DArray[i].x),
		                                                     Math.min(this.y + this.h, bb2DArray[i].y + bb2DArray[i].h) - Math.max(this.y, bb2DArray[i].y)));
	}
	return found;
};

// object used for 3D boundary information.
xlib.boundingBox3D = function(x, y, z, w, h, d) {
	// constraints: none
	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
	this.h = h;
	this.d = d;
};
// returns true if there's an overlap with another boundingBox3D.
xlib.boundingBox3D.prototype.intersect = function(bb3D) {
	return !(bb3D.x > this.x + this.w ||
	         bb3D.x + bb3D.w < this.x ||
	         bb3D.y > this.y + this.h ||
	         bb3D.y + bb3D.h < this.y ||
	         bb3D.z > this.z + this.d ||
	         bb3D.z + bb3D.d < this.z);
};
// tests for overlaps against an array of other boundingBox3D objects.
// Returns an array containing the objects with which overlap was detected.
xlib.boundingBox3D.prototype.intersectArray = function(bb3DArray) {
	if (!bb3DArray.length) return false;
	var found = [];
	var i = bb3DArray.length;
	while (i--) {
		if (bb3DArray[i].x > this.x + this.w ||
	      bb3DArray[i].x + bb3DArray[i].w < this.x ||
	      bb3DArray[i].y > this.y + this.h ||
	      bb3DArray[i].y + bb3DArray[i].h < this.y ||
	      bb3DArray[i].z > this.z + this.d ||
	      bb3DArray[i].z + bb3DArray[i].d < this.z) continue;
		found.push(bb3DArray[i]);
	}
	return found;
};
// returns the overlapping rectangle as points, or false if there's no overlap.
xlib.boundingBox3D.prototype.overlap = function(bb3D) {
	if (bb3D.x > this.x + this.w ||
	    bb3D.x + bb3D.w < this.x ||
	    bb3D.y > this.y + this.h ||
	    bb3D.y + bb3D.h < this.y ||
	    bb3D.z > this.z + this.d ||
	    bb3D.z + bb3D.d < this.z) return false;
	return new xlib.boundingBox3D(Math.max(this.x, bb3D.x),
	                              Math.max(this.y, bb3D.y),
	                              Math.max(this.z, bb3D.z),
	                              Math.min(this.x + this.w, bb3D.x + bb3D.w) - Math.max(this.x, bb3D.x),
	                              Math.min(this.y + this.h, bb3D.y + bb3D.h) - Math.max(this.y, bb3D.y),
	                              Math.min(this.z + this.d, bb3D.z + bb3D.d) - Math.max(this.z, bb3D.z));
};
// tests for overlaps against an array of other boundingBox3D objects.
// Returns a two-dimensional array containing the objects with which overlap was
// detected along with a new bounding box with the coordinates of the overlap.
xlib.boundingBox3D.prototype.overlapArray = function(bb3DArray) {
	if (!bb3DArray.length) return false;
	var found = [];
	var i = bb3DArray.length;
	while (i--) {
		if (bb3DArray[i].x > this.x + this.w ||
		    bb3DArray[i].x + bb3DArray[i].w < this.x ||
		    bb3DArray[i].y > this.y + this.h ||
		    bb3DArray[i].y + bb3DArray[i].h < this.y ||
		    bb3DArray[i].z > this.z + this.d ||
		    bb3DArray[i].z + bb3DArray[i].d < this.z) continue;
		found.push(bb3DArray[i], new xlib.boundingBox3D(Math.max(this.x, bb3DArray[i].x),
                                                         Math.max(this.y, bb3DArray[i].y),
                                                         Math.max(this.z, bb3DArray[i].z),
                                                         Math.min(this.x + this.w, bb3DArray[i].x + bb3DArray[i].w) - Math.max(this.x, bb3DArray[i].x),
                                                         Math.min(this.y + this.h, bb3DArray[i].y + bb3DArray[i].h) - Math.max(this.y, bb3DArray[i].y),
                                                         Math.min(this.z + this.d, bb3DArray[i].z + bb3DArray[i].d) - Math.max(this.z, bb3DArray[i].z)));
	}
	return found;
};

// object used for 2D collision box information. Inherits from boundingBox2D.
xlib.collisionBox2D = function(x, y, w, h) {
	// unlike boundingBox2D, dimensions must be at least 1x1.
	if (this.w < 1 || this.h < 1) {
		xlib.log("Error:    collisionBox2D constructor failed for parameters: " + [x, y, w, h] + ". Check parameters.");
		return false;
	}
	// the "borrowing" pattern, or "chaining constructors", so we get the
	// intersection testing method free. This clones the non-prototype properties
	// and methods from boundingBox2D onto this object. See:
	//   https://developer.mozilla.org/en-US/docs/JavaScript/Reference/Global_Objects/Function/call#Examples
	xlib.boundingBox2D.call(this, x, y, w, h);
};
// Part of the borrowing or chaining pattern. This clones the prototype
// methods from boundingBox2D to this object.
xlib.collisionBox2D.prototype = new xlib.boundingBox2D();

// object used for 3D collision box information. Inherits from boundingBox3D and
// adds a type property set to either 0 (for bodyBox) or 1 (for hitBox).
xlib.collisionBox3D = function(x, y, z, w, h, d) {
	// unlike boundingBox3D, dimensions must be at least 1x1. Type must be 0 or 1.
	if (w < 1 || h < 1 || d < 1) {
		xlib.log("Error:    collisionBox3D constructor failed for parameters: " + [x, y, z, w, h, d] + ". Check parameters.");
		return false;
	}
	xlib.boundingBox3D.call(this, x, y, z, w, h, d);
};
xlib.collisionBox3D.prototype = new xlib.boundingBox3D();

// object used for storing animation frame and timing. Contains helper methods
// helper methods parse large amounts of animation data, "run" an animation, and
// calculate the correct frame to draw as the app runs.
xlib.animStore = {
	// object containing references to the instantiated anim objects
	anims: {
		// create a new anim object, store a reference to it inside anims{}, and return it.
		addAnim: function(name, animFrames) {
			// name can be used later to find an animation.
			// animFrames is an array of animFrame objects.
			// don't continue if we don't have a name, the name is already taken, or
			// there's nothing in the frames array.
			if (!name || this[name] !== undefined || !animFrames || !animFrames.length) {
				xlib.log("Anim:     addAnim(): Failed to add anim '" + name + "': the name is invalid or already taken.");
				return false;
			}
			var newAnim = new xlib.animStore.anim(name, animFrames);
			if (Object.isEmpty(newAnim)) {
				xlib.log("Anim:     addAnim(): Failed to create new anim '" + name + "': invalid data passed.");
				return false;
			}
			this[name] = newAnim;
			xlib.log("Anim:     added  '" + name + "'.");
			return newAnim;
		},
		removeAnim: function() {
			// this function only removes the object reference stored inside anims{}.
			// If other references to the anim exist it will not be unloaded during GC.
			delete xlib.animStore.anims[this.name];
			return true;
		}
	},
	parseAnimData: function(animDataArray) {
		// anim data is an array of individual animation arrays in the following format:
		//   0: animName
		//   1: An array of individual image frame data arrays.
		//      Each array element contains the following array elements:
		//      0: imageName
		//      1: imageFrameRectId || imageFrameObjectReference
		//      2: tickLength
		//
		// structure:
		// [
		//   [
		//     anim name,
		//     [
		//       image name,
		//       image frame id || image frame object reference,
		//       tick length,
		//       [
		//         [bodybox1x, bodybox1y, bodybox1w, bodybox1h],
		//         [bodybox2x, ...]
		//       ],
		//       [
		//         [hitbox1x, hitbox1y, hitbox1w, hitbox1h],
		//         [hitbox2x, ...]
		//       ]
		//     ],
		//     ...
		//   ]
		// ]

		if (typeof animDataArray !== 'object' || !animDataArray.length) {
			xlib.log("Error:    Invalid animation data passed to parseAnimData().");
			return false;
		}

		// local var access
		var imageStore = xlib.imageStore;
		var images = imageStore.images;

		// length of the array passed to the function
		var animDataLength = animDataArray.length;
		// used for fast access to the current anim in the loop
		// todo: rename this, it's too generic
		var anim;
		// used for fast access to the current animation frame's values
		var animName;
		var frames;
		var framesLength;
		var imageName, image, imageFrameRectId, imageFrameRect, tickLength;
		// collision box vars
		var bodyBoxes = [], hitBoxes = [];
		var collisionBoxArray, collisionBox;
		var len;
		// final array of animation frames sent to addAnim
		var finalAnimFrames = [];
		// anim success count
		var successCount = 0;
		// badly named counters
		var i, j, k;

		i = animDataLength;
		// label used for skipping out of the major anim loop below
		animloop:
		// step through each image in the animData array
		while (i--) {
			// clear the finalAnimFrames array of any data from the previous loop.
			finalAnimFrames = [];
			anim = animDataArray[i];
			animName = anim[0];
			frames = anim[1];
			framesLength = frames.length;
			// step through each frame
			for (j = 0; j < framesLength; j++) {
				// copy array elements from the current frame into readable variables
				// and resolve to object references.

				imageName = frames[j][0];
				image = images[imageName];
				if (!image) {
					xlib.log("Error:    parseAnimData() couldn't find image name '" + imageName + "' for animation '" + anim[0] + "', frame " + j + ". Check image exists. Animation dropped.");
					// step out of the frame loop and skip to the next animation. This
					// moves execution to the label 'animstart'.
					continue animloop;
				}

				// check frame reference: could be string, object ref or id
				if (typeof frames[j][1] === "string" || frames[j][1] instanceof String) {
					imageFrameRect = image.frames[frames[j][1]];
				}
				else if (typeof frames[j][1] === "object") {
					imageFrameRect = frames[j][1];
				}
				else {
					// todo: kill redundant imageFrameRectId var
					imageFrameRectId = frames[j][1];
					imageFrameRect = image.frameRects[imageFrameRectId];
				}
				// todo: this error doesn't make sense if we passed a string or object,
				// so move it into the right place and create errors for the other cases
				if (!imageFrameRect) {
					xlib.log("Error:    parseAnimData() given invalid frameRects index for image name '" + imageName + "' for animation '" + anim[0] + "', frame " + j + ". Check image frameRects " + imageFrameRectId + " exists. Animation dropped.");
					continue animloop;
				}

				tickLength = frames[j][2];
				if (!tickLength) {
					xlib.log("Error:    parseAnimData() not adding frame with 0 tickLength for animation '" + anim[0] + "', frame " + j + ". Animation dropped.");
					continue animloop;
				}

				// optional bodyBox array; four coords in each element.
				bodyBoxes = [];
				if (frames[j][3] && frames[j][3].length) {
					collisionBoxArray = frames[j][3];
					len = collisionBoxArray.length;
					// add in source order
					for (k = 0; k < len; k++) {
						collisionBox = new xlib.collisionBox2D(
							collisionBoxArray[k][0],
							collisionBoxArray[k][1],
							collisionBoxArray[k][2],
							collisionBoxArray[k][3]
						);
						if (Object.isEmpty(collisionBox)) {
							xlib.log("Error:    parseAnimData() not adding frame with invalid bodyBox " + k + " for animation '" + anim[0] + "', frame " + j + ". Animation dropped.");
							continue animloop;
						}
						bodyBoxes.push(collisionBox);
					}
				}

				// optional hitBox array; four coords in each element.
				hitBoxes = [];
				if (frames[j][4] && frames[j][4].length) {
					collisionBoxArray = frames[j][4];
					len = collisionBoxArray.length;
					// add in source order
					for (k = 0; k < len; k++) {
						collisionBox = new xlib.collisionBox2D(
							collisionBoxArray[k][0],
							collisionBoxArray[k][1],
							collisionBoxArray[k][2],
							collisionBoxArray[k][3]
						);
						if (Object.isEmpty(collisionBox)) {
							xlib.log("Error:    parseAnimData() not adding frame with invalid bodyBox " + k + " for animation '" + anim[0] + "', frame " + j + ". Animation dropped.");
							continue animloop;
						}
						hitBoxes.push(collisionBox);
					}
				}

				// create a new animFrame from the frame info
				// todo: does need the whole image object, or can we pass just the source?
				// alternatively, pass the image and the imageFrameRectId, though that
				// makes drawing the image a bit verbose
				finalAnimFrames.push(new this.animFrame(image, imageFrameRect, tickLength, bodyBoxes, hitBoxes));
				if (!finalAnimFrames[finalAnimFrames.length - 1].image) {
					// remove the broken frame.
					finalAnimFrames.pop();
					xlib.log("Error:    parseAnimData() can't create animFrame for animation '" + anim[0] + "', frame " + j + ". Invalid values. Animation dropped");
					// step out of the frame loop and skip to the next animation. This
					// moves execution to the label 'animstart'.
					continue animloop;
				}
			}
			// add the final animation
			if (this.anims.addAnim(animName, finalAnimFrames) !== false) {
				// increment the success count.
				successCount++;
			}
		}
		// log and return the success count
		xlib.log("Anim:     Successfully parsed and added " + successCount + " of " + animDataLength + " animations");
		return successCount;
	}
};
// constructor: object representing a single animation frame.
xlib.animStore.animFrame = function(image, imageFrameRect, tickLength, bodyBoxArray, hitBoxArray) {
	if (!image || !imageFrameRect || typeof tickLength !== 'number') {
		return false;
	}
	this.image = image;
	this.imageFrameRect = imageFrameRect;
	this.tickLength = tickLength;
	this.bodyBoxes = bodyBoxArray ? bodyBoxArray : [];
	this.hitBoxes = hitBoxArray ? hitBoxArray : [];
	// cache for flipped versions of the animFrame. This includes references to
	// modified versions of the frameRect (stored on the image), bodyBoxes, and
	// hitBoxes.
	this._flippedCache = new xlib.cache();
};

// Returns a new animFrame with correct image reference and frame coordinates
// flipped on the requested axis. Flipping the collision boxes is optional.
// todo: rename this to something more generic
// todo: make this the only way of accessing the animFrame by either hiding
// the base object or folding its functionality in somewhere else.
xlib.animStore.animFrame.prototype.getFlippedVersion = function(flipAxis) {
	// flipAxis is a flag that determines which image is returned as well as
	// correcting the coordinates to match the flipped positions. Possible
	// values: 0 for no flip, 1 for horizontal, 2 for vertical, 3 for both.
	// includeCollisionBoxes flips each collision box in the bodyBoxes and
	// hitBoxes arrays as well. This defaults to false since it involves
	// considerably more work than the other, simpler flip transforms.
	// todo: this function is horribly verbose for speed. Find a better way.
	
	// todo: move this to a better spot, after the work is done
	this._flippedCache.prune();

	// early exit if no flipping is required; return original frame.
	if (!flipAxis) {
		return this;
	}

	// look for the animFrame we're after in the cache, and return it if found.
	var animFrame = this._flippedCache.getItem(flipAxis - 1);
	if (animFrame) {
		return animFrame;
	}

	var
		body = [],
		hit = [],
		i = 0,
		len = 0;

	// validation
	switch (flipAxis) {
		
		case 1:
			// x flip
			if (!(this.image.axisAvailable & 1)) {
				xlib.log("Error:    animFrame.getFlippedVersion(): image '" + this.image.name + "' doesn't have a version flipped on the x-axis.");
				return false;
			}
			len = this.bodyBoxes.length;
			for (i = 0; i < len; i++) {
				// todo: run a perf test on inheriting the object vs creating a new one
				// and copying the values across. If the former is faster, apply it to
				// the frameRect flipping code too.
				//body.push(Object.create(this.bodyBoxes[i]));
				//body[i].x = this.imageFrameRect.w - body[i].x - body[i].w;
				body.push(
					new xlib.collisionBox2D(
						this.imageFrameRect.w - this.bodyBoxes[i].x - this.bodyBoxes[i].w,
						this.bodyBoxes[i].y,
						this.bodyBoxes[i].w,
						this.bodyBoxes[i].h
					)
				);
			};
			len = this.hitBoxes.length;
			for (i = 0; i < len; i++) {
				hit.push(
					new xlib.collisionBox2D(
						this.imageFrameRect.w - this.hitBoxes[i].x - this.hitBoxes[i].w,
						this.hitBoxes[i].y,
						this.hitBoxes[i].w,
						this.hitBoxes[i].h
					)
				);
			}
			break;
			
		case 2:
			// y flip
			if (!(this.image.axisAvailable & 2)) {
				xlib.log("Error:    animFrame.getFlippedVersion(): image '" + this.image.name + "' doesn't have a version flipped on the y-axis.");
				return false;
			}
			len = this.bodyBoxes.length;
			for (i = 0; i < len; i++) {
				body.push(
					new xlib.collisionBox2D(
						this.bodyBoxes[i].x,
						this.imageFrameRect.h - this.bodyBoxes[i].y - this.bodyBoxes[i].h,
						this.bodyBoxes[i].w,
						this.bodyBoxes[i].h
					)
				);
			}
			len = this.hitBoxes.length;
			for (i = 0; i < len; i++) {
				hit.push(
					new xlib.collisionBox2D(
						this.hitBoxes[i].x,
						this.imageFrameRect.h - this.hitBoxes[i].y - this.hitBoxes[i].h,
						this.hitBoxes[i].w,
						this.hitBoxes[i].h
					)
				);
			}
			break;
			
		case 3:
			// xy flip
			if (!(this.image.axisAvailable & 4)) {
				xlib.log("Error:    animFrame.getFlippedVersion(): image '" + this.image.name + "' doesn't have a version flipped on the x and y-axis.");
				return false;
			}
			len = this.bodyBoxes.length;
			for (i = 0; i < len; i++) {
				body.push(
					new xlib.collisionBox2D(
						this.imageFrameRect.w - this.bodyBoxes[i].x - this.bodyBoxes[i].w,
						this.imageFrameRect.h - this.bodyBoxes[i].y - this.bodyBoxes[i].h,
						this.bodyBoxes[i].w,
						this.bodyBoxes[i].h
					)
				);
			}
			len = this.hitBoxes.length;
			for (i = 0; i < len; i++) {
				hit.push(
					new xlib.collisionBox2D(
						this.imageFrameRect.w - this.hitBoxes[i].x - this.hitBoxes[i].w,
						this.imageFrameRect.h - this.hitBoxes[i].y - this.hitBoxes[i].h,
						this.hitBoxes[i].w,
						this.hitBoxes[i].h
					)
				);
			}
			break;
	}

	return this._flippedCache.setItem(flipAxis - 1,
		new xlib.animStore.animFrame(
			this.image,
			this.imageFrameRect.getFlippedVersion(flipAxis),
			this.tickLength,
			body,
			hit
		)
	);

};

// constructor: object used for holding a complete animation
xlib.animStore.anim = function(name, animFrames) {
	if (!name || !animFrames || !animFrames.length) return false;
	// calc total tick length of anim
	var len = animFrames.length;
	var i;
	var animTickLength = 0;
	var tempFrame;
	var frames = [];
	for (i = 0; i < len; i++) {
		// create a new object for each frame that inherits its properties, then add
		// add additional properties such as a reference to the frame's 'parent'
		// anim and its tick position inside the anim.
		tempFrame = Object.create(animFrames[i]);
		tempFrame.anim = this;
		tempFrame.startTick = animTickLength;
		tempFrame.frameNo = i;
		frames.push(tempFrame);
		// add the frame tick length to the total for the anim.
		animTickLength += animFrames[i].tickLength;
	}
	// fail if the animation is 0 ticks long
	if (!animTickLength) return false;

	this.name = name;
	this.tickLength = animTickLength;
	this.frames = frames;
};

// todo: really don't like the name of this function
xlib.animStore.anim.prototype.createAnimInstance = function(tickOffset, gameTick) {
	// creates a new animation instance object that stores the start tick of
	// an animation and can be used to fetch the correct frame to draw.
	// tickOffset is optional and will default to 0 if undefined.
	// gameTick is optional but will override use of xlib.gameTick if provided.
	if (gameTick === undefined) {
		gameTick = xlib.gameTick;
	}

	// This used to add the offset, but that causes negative differences in
	// getCurrentFrame() with the result that an animation is stuck in frame 0
	// for the length of the tickOffset.
	if (typeof tickOffset !== 'number') {
		tickOffset = 0;
	}
	// calc the stored start tick based on the current game tick
	var startTick = gameTick - tickOffset;
	var animInstance = new xlib.animStore.animInstance(this, startTick);
	if (Object.isEmpty(animInstance)) {
		xlib.log("Anim:     createAnimInstance(): Failed to create anim instance for anim '" + this.name + "'.");
		return false;
	}
	if (xlib.debug) xlib.log("Anim:     created new animInstance for anim '" + this.name + "' with tickOffset " + -tickOffset);
	return animInstance;
};

// object representing a "running" animation
xlib.animStore.animInstance = function(anim, startTick) {
	if (!anim) return false;
	this.anim = anim;
	this.startTick = startTick;
};
// returns the animFrame object currently used for the animInstance according to
// xlib's internal gameTick or (if provided) animTick.
xlib.animStore.animInstance.prototype.getCurrentFrame = function(animTick) {
	var gameTick = xlib.gameTick;
	var ticksSinceStart;

	// todo: restore caching of results for both gametick and animtick. Store them
	// on the animInstance itself. The gameTick cache is only useful for
	// subsequent function calls in the same gameTick, so store just one gametick
	// and frame. The animTick cache will be an object using animTick % anim.tickLength
	// as the property and the frame as the value.
	// todo: do some tests to see whether caching is worth it. The loop below is
	// reasonably small and simple.

	// find out how many ticks it's been since the animation started.
	// Use animTick if it's been provided, else get the current gameTick and
	// subtract the stored animation start tick.
	if (animTick !== undefined) {
			// early exit if animTick was provided but is invalid
		if (animTick < 0) return false;
		ticksSinceStart = animTick;
	}
	else {
		ticksSinceStart = gameTick - this.startTick;
	}

	// divide the elapsed ticks by the animation tickLength and keep the
	// remainder. This gives us a tick offset within the animation tickLength
	ticksSinceStart = ticksSinceStart % this.anim.tickLength;

	var animFrames = this.anim.frames;
	var len = animFrames.length;
	// stores the sum of the animation ticks as we step through each frame
	var tickFrameTally = -1, i = 0;
	// todo: can we speed this up by testing against animFrames[i].startTick instead?
	while (i < len) {
		tickFrameTally += animFrames[i].tickLength;
		if (ticksSinceStart <= tickFrameTally) return this.anim.frames[i];
		i++;
	}
};

// todo: create flipped versions of the frameRects when adding the image? Then
// animInstance.getCurrentFrame() could just return the correct object ref
// instead of building the new rect potentially hundreds of times per gameTick.
xlib.imageStore = {
	images: {
		addImage: function(name, srcFile, generateFlippedImages, frameRectArray) {
			// early exits
			if (!name || this[name] !== undefined || !srcFile) {
				xlib.log("Image:    Failed to add image '" + name + "': the name is invalid or already taken.");
				return false;
			}
			var newImage;
			// create the new object
			newImage = new xlib.imageStore.image(name, srcFile, generateFlippedImages, frameRectArray);
			if (Object.isEmpty(newImage)) {
				xlib.log("Error:    addImage() couldn't add image '" + name + "'.");
				return false;
			}

			// store a reference to the new image
			this[name] = newImage;

			// step through all the frames, extract their name, and create a lookup
			// properties on the image object.
			// todo: find a nicer place to put these
			var rects = this[name].frameRects;
			this[name].frames = {};
			var frames = this[name].frames;
			var i = rects.length;
			while (i--) {
				if (!rects[i].frameName) {
					xlib.log("Warning:  imageStore.addImage() couldn't create lookup property for frame '" + rects[i].frameName + "'. The frame name is invalid or already in use.");
					continue;
				}
				if (frames[rects[i].frameName] === undefined) {
					frames[rects[i].frameName] = rects[i];
				}
			}

			// add this image to the pending load count
			xlib.imageStore.loadsPending++;
			
			// update the image count
			xlib.imageStore.imageCount++;

			xlib.log("Image:    added  '" + name + "'.");
			return newImage;
		}
	},
	// contains the number of images that haven't finished loading yet
	loadsPending: 0,
	// contains the number of images that have finished loading.
	loadsComplete: 0,
	// contains the total number of images held in imageStore.images.
	imageCount: 0,
	// used to store the function called for the onLoadComplete event.
	setLoadCompleteHandler: function(handlerFunc) {
		if (!handlerFunc) return false;
		this._loadComplete = handlerFunc;
	},
	_loadComplete: function(image) {
		// call the user-defined function in onLoadComplete
		if (!this.onLoadComplete) {
			xlib.log("Warning:  No handler set for imageStore.onLoadComplete");
		}
		this.onLoadComplete(image);
	},
	// Helper function to create a series of bounding boxes for a row or column
	// of sprites with uniform width and height. The optional X and Y offsets
	// set the first bounding box's x and y (useful when creating multiple
	// horizontal bounding box arrays in a single image).
	// Direction should be 0 for a horizontal series and 1 for vertical.
	// todo: always assumes positive increments on axis
	_createFrameRectSeries: function(axis, x, y, w, h, count, originX, originY, frameName) {
		var i;
		if (axis === undefined ||
		    x === undefined ||
		    y === undefined ||
		    !w ||
		    !h ||
		    !count ||
		    originX === undefined ||
		    originY === undefined) return false;
		if (count < 1) return false;
		var frameRects = [];
		// pass frameName with an incrementing number on the end so that we always
		// have a unique frame name.
		for (i = 0; i < count; i++) {
			frameRects[i] = new xlib.imageStore.frameRect(x, y, w, h, originX, originY, frameName + i);
			if (Object.isEmpty(frameRects[i])) {
				xlib.log("Error:    createFrameRectSeries() cannot generate frameRect: " + [x, y, w, h, originX, originY, frameName + i] + "; frameRect dropped.");
				frameRects.pop();
			}
			(!axis) ? x += w : y += h;
		}
		return frameRects;
	},
	parseImageData: function(imageDataArray) {
		// image data is an array of individual image arrays in the following format:
		//   0: name
		//   1: srcFile
		//   2: (optional) generateFlippedImages
		//   3: (optional) An array of individual frame data arrays to be parsed by createFrameRectSeries
		//      Each array element contains the following array elements:
		//      0: positionX, the x position of the first frame in the set
		//      1: positionY, the y position of the first frame in the set
		//      2: frameWidth, the width of the frameRect
		//      3: frameHeight, the height of the frameRect
		//      4: frameCount, the number of frames in this set
		//      5: (optional) originX, the point considered '0' on the x-axis by the drawing and physics routines
		//      6: (optional) originY, the point considered '0' on the y-axis by the drawing and physics routines
		//      7: (optional) frameName, a name that can be used to look up the frame
		//
		// example:
		// [
		//	[name, srcFile, 1,
		//    [
		//      [positionX, positionY, frameWidth, frameHeight, frameCount, originX, originY, frameName],
		//      [...]
		//    ]
		//  ],
		//	[...]
		// ]

		if (typeof imageDataArray !== 'object' || !imageDataArray.length) {
			xlib.log("Error:    Invalid image data passed to parseImageData()");
			return false;
		}

		// length of the array passed to the function
		var imageDataArrayLength = imageDataArray.length;
		// used for fast access to the current frameData's values
		var imageName;
		var srcFile;
		var generateFlippedImages;
		var frameData;
		var frameDataLength;
		// origins (used as offsets for drawing/collision
		var positionX, positionY, frameWidth, frameHeight, frameCount, originX, originY, frameName;
		// the final set of frameRects for an image
		var finalFrameRects = [];
		var tempFrameRects;
		// image success count
		var successCount = 0;
		// temporary reference to the current array element
		var imageData;
		// new image object
		var image;

		var i = imageDataArrayLength;
		var j;

		// label for continue statement within inner loop
		imageloop:
		// step through each image in imageDataArray
		while (i--) {
			// clear any existing data in finalFrameRects
			finalFrameRects = [];

			// validate the image reference
			imageData = imageDataArray[i];

			// basics
			imageName = imageData[0];
			srcFile = imageData[1];
			generateFlippedImages = imageData[2] ? imageData[2] : 0;

			// frameData is optional
			frameData = (imageData[3] !== undefined) ? imageData[3] : 0;
			frameDataLength = frameData.length;
			if (frameDataLength) {
				// step through each frameData
				for (j = 0; j < frameDataLength; j++) {
					// copy values from the current frameData into variables
					positionX = frameData[j][0];
					positionY = frameData[j][1];
					frameWidth = frameData[j][2];
					frameHeight = frameData[j][3];
					frameCount = frameData[j][4] || 1;
					originX = (typeof frameData[j][5] === 'number') ? frameData[j][5] : 0;
					originY = (typeof frameData[j][6] === 'number') ? frameData[j][6] : 0;
					frameName = (typeof frameData[j][7] === 'string') ? frameData[j][7] : "";
					// more than one frame? pass frame data to _createFrameRectSeries.
					// otherwise, deal with it ourselves.
					if (frameCount > 1) {
						// first parameter is direction -- here, always horizontal
						tempFrameRects = this._createFrameRectSeries(0, positionX, positionY, frameWidth, frameHeight, frameCount, originX, originY, frameName);
					}
					else {
						tempFrameRects = [new xlib.imageStore.frameRect(positionX, positionY, frameWidth, frameHeight, originX, originY, frameName)];
					}
					// if something went wrong frameRectsTemp will contain no elements or
					// the first object will be blank
					if (!tempFrameRects.length || Object.isEmpty(tempFrameRects[0])) {
						xlib.log("Error:    parseImageData() can't create frameRects for image '" + imageData[0] + "', frame " + j + " (invalid values). Image dropped.");
						continue;
					}
					else {
						finalFrameRects.push.apply(finalFrameRects, tempFrameRects);
					}
				}
			}
			else {
				// frame data hasn't been provided. Set frameRects to an empty array
				// and addImage will correct it when the image loads.
				finalFrameRects = [];
			}
			// all frameRects data is calculated and stored in frameRects.
			// Send all of this image's data off to addImage.
			image = xlib.imageStore.images.addImage(imageName, srcFile, generateFlippedImages, finalFrameRects);
			if (!image.name) {
				xlib.log("Error:    parseImageData() sent invalid information to addImage (image '" + imageData[0] + "', frame " + j + "). Image dropped.");
				continue;
			}
			// add to the images object.
			xlib.imageStore.images[image.name] = image;
			// increment the success count.
			successCount++;
		}
		// log and return the success count
		xlib.log("Image:    Successfully parsed and added " + successCount + " of " + imageDataArrayLength + " images");
		return successCount;
	},
	imageLoadError: function() {
		xlib.log("Error:    image '" + this.imageRef.name + "' could not be loaded: Path: " + this.src);
	},
	imageLoadSuccess: function() {
		var image = this.imageRef;
		// local access + store on image object
		// todo: rename originalWidth, originalHeight to something that sounds like
		// it represents the w,h of the original, non-composite image file
		var originalWidth = image.originalWidth = this.width;
		var originalHeight = image.originalHeight = this.height;
		var frameRects = image.frameRects;
		var frameCount = frameRects.length;
		var i;
		// if frameRectArray wasn't provided then create a single frameRect using
		// the image dimensions.
		if (!frameCount) {
			frameRects.push(new xlib.imageStore.frameRect(0, 0, originalWidth, originalHeight, 0, 0));
			if (Object.isEmpty(frameRects)) {
				xlib.log("Error:    image onload cannot generate frameRects for image '" + image.src + "'. Invalid dimensions. Check file.");
				return false;
			}
			// add a reference to the source image
			frameRects[0].image = image;
		}
		else {
			// Here's the only place we can step through frameRects and test whether
			// they're within the source image dimensions. If a coordinate is outside
			// the source image dimensions then we relocate it (in the case of x, y)
			// or trim it (w, h) then throw a console warning to the developer.
			// Chrome stops with DOM length exception if we sample pixels outside
			// source image dimensions.
			for (i = 0; i < frameCount; i++) {
				// add a reference to the source image
				frameRects[i].image = image;
				if (frameRects[i].x > originalWidth) {
					frameRects[i].x = originalWidth - 1;
					xlib.log("Warning:  image '" + image.name + "' has x coord outside image dimensions in frameRect[" + i + "]. FrameRect has been trimmed.");
				}
				if (frameRects[i].y > originalHeight) {
					frameRects[i].y = originalHeight - 1;
					xlib.log("Warning:  image '" + image.name + "' has y coord outside image dimensions in frameRect[" + i + "]. FrameRect has been trimmed.");
				}
				if (frameRects[i].x + frameRects[i].w > originalWidth) {
					frameRects[i].w = originalWidth - frameRects[i].x;
					xlib.log("Warning:  image '" + image.name + "' has width larger than image dimensions in frameRect[" + i + "]. FrameRect has been trimmed.");
				}
				if (frameRects[i].y + frameRects[i].h > originalHeight) {
					frameRects[i].h = originalHeight - frameRects[i].y;
					xlib.log("Warning:  image '" + image.name + "' has height larger than image dimensions in frameRect[" + i + "]. FrameRect has been trimmed.");
				}
			}
		}
		// create the permanent canvas storage along with any flipped source
		// versions if required
		// todo: rename source since it makes it hard to name variables that
		// represent the original source width/height. imageData? canvas?
		image.source = image._createComposite();
		if (image.source === false) {
			xlib.log("Error:    image._createComposite(): couldn't create composite for image '" + image.name + "'.");
			return false;
		}
		// delete the original img
		delete image.img;
		// debug: output all the composite images to the document
		if (xlib.debug > 1) document.body.appendChild(image.source);
		// flag the image as loaded
		image.loaded = true;
		// reduce the pending load count
		xlib.imageStore.loadsPending--;
		// increase the completed load count
		xlib.imageStore.loadsComplete++;
		xlib.log("Image:    loaded '" + image.name + "' with " + image.frameRects.length + " frames. " + xlib.imageStore.loadsPending + " images pending");
		// trigger the loadComplete event
		xlib.imageStore._loadComplete(image);
	}
};
xlib.imageStore.image = function(name, srcFile, generateFlippedImages, frameRectArray) {
	if (!name || !srcFile) return false;
	this.name = name;
	// if the frameRectsArray hasn't been passed in, leave it unset on the
	// object. We'll create a single frameRect for the image after it's loaded.
	this.frameRects = (frameRectArray) ? frameRectArray : [];
	// flipped image storage. This is a horrible solution to a simple problem
	// ignored by the original designers of canvas. Drawing a flipped version
	// of an image involves using a scale transform on either the image or
	// canvas, copying bits, then resetting the transform. This can results in
	// dramatic framerate losses as at 20100608. Ideally we'd pass through
	// negative box coordinates to drawImage() and it'd result in the pixels
	// being drawn in reverse.
	// In order to keep framerate reliable regardless of how many images are being
	// drawn flipped we build a composite image that contains the original and any
	// flipped versions requested. This composite is stored on a canvas and the
	// original image is destroyed. This solution increases memory usage but at
	// least no extra data is sent across the wire and framerate is dependable.
	// The composite image is generated during the source.onload() event below.
	this.axisAvailable = generateFlippedImages;
	// store a copy of the original source filename
	this.src = srcFile;
	// create the temporary image object and assign the filename
	this.img = new Image();
	this.img.src = srcFile;
	// We need a reference back to the parent image object inside the event
	// handlers. This isn't a nice solution. The reference is used when updating
	// the loaded flag and triggering the loadComplete event.
	this.img.imageRef = this;

	// set up onerror handler
	this.img.onerror = xlib.imageStore.imageLoadError;

	// set up onload handler
	this.img.onload = xlib.imageStore.imageLoadSuccess;
};

// helper function for determining how many pixels down the Y axis a flipped
// version is down a source image. This number can be treated as an offset to
// the correct image data for an axis.
// Returns 0 or a positive number in pixels.
xlib.imageStore.image.prototype.getFlippedVersionPositionY = function(axisFlip) {
	// make sure there's a version of it first
	if (!(this.axisAvailable & axisFlip) && axisFlip) {
		xlib.log("Error:    image.getFlippedVersionPositionY(): image '" + this.name + "' doesn't have flipped version for requested axis " + axisFlip + ".");
		return false;
	}
	// todo: rename these vars. They're misleading.
	var offsetx  = (this.axisAvailable & 1) ? this.originalHeight : 0;
	var offsety  = (this.axisAvailable & 2) ? offsetx + this.originalHeight : 0;
	var offsetxy = (this.axisAvailable & 4) ? offsety + this.originalHeight : 0;
	switch (axisFlip) {
		case 0: return 0;
		case 1: return offsetx;
		case 2:
		case 3: return offsety;
		case 4:
		case 7: return offsetxy;
	}
};

// create a canvas object large enough to fit the original image and any
// flipped versions required, then draw the original and flipped versions
// to the canvas.
xlib.imageStore.image.prototype._createComposite = function() {
	var tempCanvas = document.createElement("canvas");
	// decide how big it should be
	tempCanvas.width  = this.originalWidth;
	tempCanvas.height = this.getFlippedVersionPositionY(this.axisAvailable) + this.originalHeight;
	var offset = 0;
	var tempContext = tempCanvas.getContext("2d");
	// copy the source image onto the canvas as is
	tempContext.drawImage(this.img, 0, offset);
	offset += this.originalHeight;
	// flipped on x-axis
	if (this.axisAvailable & 1) {
		// save transform state
		tempContext.save();
		tempContext.scale(-1,1);
		tempContext.drawImage(this.img, -this.originalWidth, offset);
		// restore original transform state
		tempContext.restore();
		offset += this.originalHeight;
	}
	// flipped on y-axis
	if (this.axisAvailable & 2) {
		tempContext.save();
		tempContext.scale(1,-1);
		tempContext.drawImage(this.img, 0, -this.originalHeight - offset);
		tempContext.restore();
		offset += this.originalHeight;
	}
	// flipped on x and y-axis
	if (this.axisAvailable & 4) {
		tempContext.save();
		tempContext.scale(-1,-1);
		tempContext.drawImage(this.img, -this.originalWidth, -this.originalHeight - offset);
		tempContext.restore();
	}
	return tempCanvas;
};
xlib.imageStore.image.prototype.drawToCanvas = function(context, destX, destY, destW, destH, roundDestCoordinates, frame) {
	// todo: need proper error number returns for things like 'invalid context'
	if (context === undefined) return false;

	var xlib = window.xlib;
	var drawScaleX = xlib.drawScaleX;
	var drawScaleY = xlib.drawScaleY;

	var imageSource = this.source;

	// if the image hasn't loaded we can't draw it. Exit gracefully.
	if (!this.loaded) return false;

	// the structure here is optimised for the different argument counts
	// that can be passed to drawImage():
	//  - no dest coords, useful for full-canvas backgrounds
	//  - x,y coords, useful for drawing an entire image somewhere
	//  - x,y,w,h coords, useful for drawing an entire image scaled somewhere
	//  - x,y,w,h and frameId, useful for drawing part of an image somewhere
	// todo: should we provide for drawing part of an image scaled?

	if (frame === undefined) {
		if (destX === undefined) {
			// no coordinates; draw entire image at 0,0
			context.drawImage(imageSource, 0, 0);
			return true;
		}
		else if (destW === undefined) {
			// only X,Y coordinates; draw entire image at X,Y
			// complain if dodgy coordinates passed to function.
			if (typeof destX !== 'number' ||
			    typeof destY !== 'number') {
				xlib.log("Error:    image.drawToCanvas() given non-numeric coordinates for destX or destY.");
			}
			context.drawImage(imageSource, destX * drawScaleX, destY * drawScaleY);
			return true;
		}
		else {
			// only X,Y,W,H coordinates; draw entire image at X,Y scaled to fit W,H
			// complain if dodgy coordinates passed to function.
			if (typeof destX !== 'number' ||
			    typeof destY !== 'number' ||
			    typeof destW !== 'number' ||
			    typeof destH !== 'number') {
				xlib.log("Error:    image.drawToCanvas() given non-numeric coordinates for destX, destY, destW or destH.");
			}
			if (roundDestCoordinates) {
				destX = Math.round(destX);
				destY = Math.round(destY);
				destW = Math.round(destW);
				destH = Math.round(destH);
			}
			context.drawImage(imageSource, destX * drawScaleX, destY * drawScaleY, destW * drawScaleX, destH * drawScaleY);
			return true;
		}
	}

	// full X,Y,W,H coordinates plus frameId; draw entire or partial image
	// at X,Y scaled to fit W,H
	// complain if dodgy coordinates passed to function.
	if (typeof destX !== 'number' ||
	    typeof destY !== 'number' ||
	    typeof destW !== 'number' ||
	    typeof destH !== 'number') {
		xlib.log("Error:    image.drawToCanvas() given non-numeric coordinates for destX, destY, destW or destH.");
	}

	destW = frame.w;
	destH = frame.h;
	if (roundDestCoordinates) {
		// W,H will always be integers if sampled from image size
		destX = Math.round(destX);
		destY = Math.round(destY);
	}
	context.drawImage(imageSource,
	                  frame.x,
		                frame.y,
		                frame.w,
		                frame.h,
		                destX * drawScaleX,
		                destY * drawScaleY,
		                destW * drawScaleX,
		                destH * drawScaleY
		                );
	return true;
};
xlib.imageStore.image.prototype.drawToCanvasTiled = function(context, offsetX, offsetY, frame) {
	// todo: need proper error number returns for things like 'invalid context'
	if (context === undefined) return false;

	var xlib = window.xlib;
	var drawScaleX = xlib.drawScaleX;
	var drawScaleY = xlib.drawScaleY;

	var imageSource = this.source;

	// if the image hasn't loaded we can't draw it. Exit gracefully.
	if (!this.loaded) return false;

	if (!frame) frame = this.frameRects[0];
	
	if (offsetX === undefined) {
		offsetX = 0;
	}
	else {
		// make sure offsetX is within bounds
		offsetX = offsetX % frame.w;
	}
	if (offsetY === undefined) {
		offsetY = 0;
	}
	else {
		// make sure offsetY is within bounds
		offsetY = offsetY % frame.h;
	}

	// current draw offsets
	var drawX = offsetX - frame.w * drawScaleX;
	// todo
	var drawY = offsetY - frame.h * drawScaleY;
	
	
	var canvasWidth = context.canvas.width;
	var canvasHeight = context.canvas.height;
	
	while (drawY < canvasHeight) {
		while (drawX < canvasWidth) {
			// draw the image
			context.drawImage(
				imageSource,
				frame.x,
				frame.y,
				frame.w,
				frame.h,
				drawX,
				drawY,
				frame.w,// * drawScaleX,
				frame.h// * drawScaleY
			);
			
			
			// todo: make a version of this function that generates a drawList instead
			// of drawing immediately
			/*
				// create a drawlist element for this image chunk
				list.push([
					imageSource,
					this.frameRects[0],
					// hack: this should really be creating a new frameRect
					{
						x: drawX,
						y: drawY,
						w: this.frameRects[0].w,
						h: this.frameRects[0].h
					},
					1000,
					1
				]);
			*/
	
			// todo: optimise this to clip offscreen image dest to visible
			// todo: firefox's coordinate rounding leaves small gaps between images.
			// hack: the -1 is a temp workaround
			drawX += frame.w * drawScaleX - 1;
			
			// create the 
			
		}
		// todo: optimise this to clip offscreen image dest to visible
		// todo: firefox's coordinate rounding leaves small gaps between images.
		// hack: the -1 is a temp workaround
		drawY += frame.h * drawScaleY - 1;
		// reset x
		var drawX = offsetX - frame.w * drawScaleX;
	}
	return true;
};
xlib.imageStore.frameRect = function(x, y, w, h, ox, oy, frameName) {
	xlib.boundingBox2D.call(this, x, y, w, h);
	// unlike boundingBox2D, points can't be negative and dimensions must be at
	// least 1x1.
	if (this.x < 0 || this.y < 0 || this.w < 1 || this.h < 1) {
		xlib.log("Error:    imageStore.frameRect constructor given frame '" + frameName + "' with x or y less than 0, or width or height less than 1. Check your image frame data for invalid values. Frame dropped.");
		return false;
	}
	// origin points (offsets used for drawing/collision)
	this.ox = (ox !== undefined) ? ox : 0;
	this.oy = (oy !== undefined) ? oy : 0;
	// reference
	this.frameName = (frameName) ? frameName : "";
	// image
	this.image = undefined;
	// cache for flipped versions of the frameRects. This is primarily accessed
	// by .getFlippedVersion(), which will prune the cache as necessary.
	this._frameRectCache = new xlib.cache();
};
xlib.imageStore.frameRect.prototype = new xlib.boundingBox2D();

// finds and returns the appropriate frameRect set for the image, based on
// whether the caller requires a flipped version. This function takes advantage
// of the frameRectCache on the image object.
xlib.imageStore.frameRect.prototype.getFlippedVersion = function(flipAxis) {
	// flipAxis is a flag that determines whether the original frameRect is
	// returned, or an alternate whose coordinates have been flipped on the
	// specified axes.
	// flipAxis: 0 for no flip, 1 for horizontal, 2 for vertical, 3 for both.
	// todo: this function is horribly verbose for speed. Find a better way.

	// Note: this function uses the flipped frameRect cache to avoid recreating
	// new frameRects every time they're requested. To ensure the cache doesn't
	// expand without limit, trigger a prune.
	this._frameRectCache.prune();	
	
	// early exit if no flipping is required; return original frame.
	if (!flipAxis) {
		return this;
	}

	switch (flipAxis) {
		case 1:
			// x flip
			if (!(this.image.axisAvailable & 1)) {
				xlib.log("Error:    frameRect.getFlippedVersion(): image '" + this.image.name + "' doesn't have a version flipped on the x-axis.");
				return false;
			}
			return this._frameRectCache.getItem(0) || this._frameRectCache.setItem(0,
				new xlib.imageStore.frameRect(
					this.image.originalWidth - this.x - this.w,
					// in order to access the correct part of the image, we need to get
					// the Y offset for the flipped version we're after
					this.y + this.image.getFlippedVersionPositionY(1),
					this.w,
					this.h,
					-this.ox,
					this.oy
				)
			);
		case 2:
			// y flip
			if (!(this.image.axisAvailable & 2)) {
				xlib.log("Error:    frameRect.getFlippedVersion(): image '" + this.image.name + "' doesn't have a version flipped on the y-axis.");
				return false;
			}
			return this._frameRectCache.getItem(1) || this._frameRectCache.setItem(1,
				new xlib.imageStore.frameRect(
					this.x,
					this.image.originalHeight - this.y - this.h +  this.image.getFlippedVersionPositionY(2),
					this.w,
					this.h,
					this.ox,
					-this.oy
				)
			);
		case 3:
			// xy flip
			if (!(image.axisAvailable & 4)) {
				xlib.log("Error:    frameRect.getFlippedVersion(): image '" + this.image.name + "' doesn't have a version flipped on the x and y-axis.");
				return false;
			}
			return this._frameRectCache.getItem(2) || this._frameRectCache.setItem(2,
				new xlib.imageStore.frameRect(
					this.image.originalWidth - this.x - this.w,
					this.image.originalHeight - this.y - this.h + this.image.getFlippedVersionPositionY(4),
					this.w,
					this.h,
					-this.ox,
					-this.oy
				)
			);
	}
};

// todo: rebuild this whole thing. It's a mess and could be much simpler.
xlib.audioStore = {
	// audio is a clusterfuck. As at 20100808:
	//   - chrome skips the first audio frame in ogg files (fixed in dev builds)
	//     http://code.google.com/p/chromium/issues/detail?id=31408
	//   - chrome won't load audio if it's g-zipped server side.
	//     http://randallagordon.com/blog/2009/07/19/jaraoke-html5-audio-tag-demo/
	//   - chrome doesn't trigger the error event on particular server setups,
	//     so it's a silent fail with no way of detection.
	//   - chrome won't reuse cached audio when creating a new Audio() object
	//     with an identical url to one already loaded (was fixed in dev, broken
	//     again). Safari 5 and below do the same thing.
	//     todo: check if plonking the file in localstorage fixes it
	//     http://mindtrove.info/html5-audio-caching/
	//   - chrome may not fire the progress event if an audio file is in cache.
	//   - chrome has trouble setting currentTime for small files, regardless
	//     of format.
	//   - chrome won't play really short mp3 files (<0.2 sec).
	//     http://code.google.com/p/chromium/issues/detail?id=32956
	//   - Moz won't play a local ogg file because the file isn't sent with a
	//     mime-type. This makes testing annoying; can't force mime-type client-side.
	//   - badly-configured servers can't host oggs because of the mime-type requirement.
	//   - Moz won't play extremely short (<0.2sec) ogg files, but .wav works.
	//     Easy workaround is to pad the end of the ogg file with silence.
	//   - Moz doesn't support the loop attribute. See nasty hack in audioSample.play().
	audioSamples: {
		addAudioSample: function(name, srcFileArray) {
			// early exit
			if (typeof name !== 'string') {
				xlib.log("Error:    xlib.audioStore.audioSamples.addAudioSample() give invalid srcFileArray.");
				return false;
			}
			var extension;
			var newAudioSample;
			var m;
			// get the audio format support list if we don't already have one.
			if (!xlib.audioStore.support) xlib.audioStore._buildSupportArray();
			var support = xlib.audioStore._supportsFileType;
			// determine which file from the src list we'll use.
			var l = srcFileArray.length;
			for (m = 0; m < l; m++) {
				// get the extension. Because we don't have access to the mime type of
				// the file (no sniffing) this becomes our only indicator of file type.
				// todo: make this handle extensions that aren't 3 letters
				extension = srcFileArray[m].substr(-3);
				if (support[extension] && support[extension] === true) break;
			}
			if (m === l) {
				xlib.log("Error:    audioStore.addAudioSample(): no supported audio files in srcFileArray");
				return false;
			}
			// m will point to the usable file.
			// create new audio object
			newAudioSample = new xlib.audioStore.audioSample(name, srcFileArray[m]);
			if (Object.isEmpty(newAudioSample)) {
				xlib.log("Error:    audioStore.addAudioSample() couldn't add audio '" + name + "'.");
				return false;
			}

			this[name] = newAudioSample;

			// add this audio sample to the pending load count
			xlib.audioStore.loadsPending++;
			
			// update the audio sample count
			xlib.audioStore.audioSampleCount++;

			xlib.log("Audio:    added  '" + name + "'.");
			return newAudioSample;
		}
	},
	audioEnabled: true,
	loadsPending: 0,
	loadsComplete: 0,
	audioSampleCount: 0,
	_supportsLoop: (typeof new Audio().loop === 'boolean') ? true : false,
	_supportsFileType: null,
	_buildSupportArray: function() {
		// build a list of which audio formats have support. Call this only once and
		// use this._supportsFileType from then on.
		// canPlayType() returns "no", "maybe" or "probably". What a horrible api.
		// see http://html5doctor.com/native-audio-in-the-browser/
		var au = new Audio("");
		this._supportsFileType = {};
		this._supportsFileType.wav = ((au.canPlayType("audio/wave") !== "no") && (au.canPlayType("audio/wave") !== "")) ? true : false;
		this._supportsFileType.ogg = ((au.canPlayType("audio/ogg") !== "no") && (au.canPlayType("audio/ogg") !== "")) ? true : false;
		this._supportsFileType.mp3 = ((au.canPlayType("audio/mpeg") !== "no") && (au.canPlayType("audio/mpeg") !== "")) ? true : false;
		 // old chrome used the wrong mime type for mp3, so check that too
		this._supportsFileType.mp3 = ((au.canPlayType("audio/mp3") !== "no") && (au.canPlayType("audio/mp3") !== "")) ? true : this._supportsFileType.mp3;
		// Firefox/Gecko 26 supports mp3s but has a bug that causes decoding to
		// arbitrarily fail and kill new audio decoding for seconds at a time on
		// Vista, 7, and 8. This is expected to be fixed with the reintroduction of
		// the DirectShow backend in Firefox/Gecko 28. Browser sniff and disable mp3
		// support for these two versions. See also:
		//   https://bugzilla.mozilla.org/show_bug.cgi?id=882537
		//   https://bugzilla.mozilla.org/show_bug.cgi?id=936796
		//   https://bugzilla.mozilla.org/show_bug.cgi?id=945947
		if (navigator.userAgent.toLowerCase().indexOf("gecko/") !== -1 && (navigator.userAgent.toLowerCase().indexOf("/26.") !== -1 || navigator.userAgent.toLowerCase().indexOf("/27.") !== -1)) {
			this._supportsFileType.mp3 = false;
		}
		if (!this._supportsFileType.mp3 && !this._supportsFileType.ogg && !this._supportsFileType.wav) {
			xlib.log("Error:    addAudio: No audio formats supported");
			return false;
		}
		return true;
	},
	// used to store the function called for the onLoadComplete event.
	setLoadCompleteHandler: function(handlerFunc) {
		if (!handlerFunc) return false;
		this._loadComplete = handlerFunc;
	},
	_loadComplete: function(audioSample) {
		// call the user-defined function in onLoadComplete
		if (!this.onLoadComplete) xlib.log("Warning:  No handler set for audioStore.onLoadComplete");
		this.onLoadComplete(audioSample);
	},
	// Convenience function for playing a sample by name.
	playSample: function(sampleName, loop) {
		// silent exit if samplename is null
		if (sampleName === null) return true;
		// check that sample exists
		if (!this.audioSamples[sampleName]) {
			xlib.log("Error:    audioStore.playSample() given invalid sample name '" + sampleName + "'.");
			return false;
		}
		return this.audioSamples[sampleName].play(loop);
	},
	// convenience function for adding a lot of samples at once.
	parseAudioData: function(audioData) {
		if (!audioData) return false;
		for (var p in audioData) {
			if (this.audioSamples.addAudioSample(p, audioData[p]) === false) {
				xlib.log("Error:    audioStore.parseAudioData() couldn't add '" + p + "'.");
			}			
		}
		return true;
	},
	audioLoadError: function() {
		xlib.log("Error:    audio '" + this.audioSampleRef.name + "' could not be loaded: Path: " + this.src);		
	},
	audioLoadSuccess: function() {
		// note: canplaythrough can fire multiple times in Firefox, so immediately
		// return if we've already flagged it as loaded.
		if (this.audioSampleRef.loaded && this.audioSampleRef.loaded === true) return false;
		// flag as loaded
		this.audioSampleRef.loaded = true;
		// reduce the pending load count
		xlib.audioStore.loadsPending--;
		// increase the completed load count
		xlib.audioStore.loadsComplete++;
		xlib.log("Audio:    loaded '" + this.audioSampleRef.name + "'. " + xlib.audioStore.loadsPending + " audio samples pending");
		// trigger the loadComplete event
		xlib.audioStore._loadComplete(this.audioSampleRef);		
	}
};
xlib.audioStore.audioSample = function(name, srcFile) {
	if (!name || !srcFile) return false;
	this.name = name;
	this.source = new Audio();
	this.source.src = srcFile;
	// We need a reference back to the audioSample object inside the event
	// handlers. This isn't a nice solution but we can clean up afterwards.
	// The reference is used when updating the loaded flag and triggering the
	// canPlayThrough event.
	this.source.audioSampleRef = this;
	this.source.load();
	// set up onerror handler
	this.source.addEventListener("error", xlib.audioStore.audioLoadError, false);
	// media elements require unique events to satisfy streaming and early
	// playing of partially-filled buffers. The 'load' event doesn't exist,
	// but we can monitor progress and check whether the loaded data size
	// matches the total file size, essentially simulating load.
	this.source.addEventListener("canplaythrough", xlib.audioStore.audioLoadSuccess, false);
	// the timestamp of the last time we created a playing instance of the sample.
	// See notes inside play() below.
	this.lastInstanceTimestamp = 0;
};
// Duplicates a single audio sample, starts playing it, and returns a
// reference to the new audio object. Further commands such as pausing are
// performed on the new instance.
xlib.audioStore.audioSample.prototype.play = function(loop) {
		// chrome 5.0.375.86 and below won't rewind the sound and
		// queues play() calls, so the audio can lag severely.
		// safari 5 and below ignore the cached audio file and always request it
		// again from the server.
		// hack: fix me
		if (!xlib.audioStore.audioEnabled) return;
		// check when the last instance of this sample was created, and only create
		// a new one if there was at least 50 milliseconds between playing attempts.
		// If it's less than 50ms, then play() the last sample instance again and
		// return it as if we just created it.
		// This avoids the issue of overwhelming the browser, OS or device with new
		// audio objects or the sound mixer creating hyper-compressed, clipped or
		// sawtooth-like output when multiple identical samples are mixed.
		if (Date.now() - this.lastInstanceTimestamp < 50 && this.lastInstance) {
			// note that we don't update the timestamp here since it could cause the
			// following issue: if a caller requests the same sample repeatedly every
			// 40ms, then this function would keep extending the lifetime of the
			// existing instance until it completed playing. We want to allow multiple
			// instances of the same sample to overlap, but just with a minimum gap
			// between new instance creation.
			this.lastInstance.play();
			return this.lastInstance;
		}
		// create a new instance of the audio sample.
		// note: browser garbage collection shouldn't remove the audio element
		// while it's being played, but that may depend on the implementation. See
		// http://lists.w3.org/Archives/Public/public-html/2011Feb/0007.html
		// for a discussion/confirmation of audio object lifetime.
		// Also: http://www.whatwg.org/specs/web-apps/current-work/multipage/the-video-element.html#playing-the-media-resource
		// "Media elements must not stop playing just because all references to them
		// have been removed".
		var au = this.source.cloneNode(true);
		// looping is broken in earlier Firefox implementations. Work around it if
		// necessary.
		if (loop) {
			if (xlib.audioStore.supportsLoop) {
				au.loop = true;
			}
			else {
				// workaround for missing loop support
				au.addEventListener('ended', function() {
					this.currentTime = 0;
					this.play();
				}, false);
			}
		}
		au.play();
		// store a reference to the new audio object so that if we're asked to play
		// this sample again within a very short timeframe we can just play this
		// instance again and return it. The reference is set to self-destruct after
		// 50 milliseconds (the timeframe we use above) to avoid wasting memory.
		this.lastInstanceTimestamp = Date.now();
		this.lastInstance = au;
		var that = this;
		window.setTimeout(function() {
			that.lastInstance = null;
		}, 50);
		// return a reference to the new audio instance.
		return au;
};

// creates a polygonal boundary object from a series of coords in the format:
//   [ [x,y], [x,y], [x,y], ... ]
// clockwise order is assumed.
xlib.polygonBoundary = function(poly) {
	var
		i,
		l = poly.length,
		// create the outer storage arrays for vertices and line normals.
		points = new Array(l),
		// normal[0] contains the normal for the first and second vertex, and so on
		normals = new Array(l),
		dx,
		dy,
		mag;
		
	if (l < 3) {
		xlib.log("Error:    xlib.isPointInPoly() given coordinate array containing less than 3 sets of x,y coords.");
		return false;
	}

	// create the storage arrays for the actual vectors. If ArrayBuffer is
	// supported then use the most appropriate type, otherwise fall back to
	// a standard js array.
	for (i = 0; i < l; i++) {	
		if (ArrayBuffer) {
			if (Math.floor(poly[i][0]) === poly[i][0] && Math.floor(poly[i][1]) === poly[i][1]) {
				if (poly[i][0] > -1 && poly[i][0] < 65536) {
					points[i] = new Uint16Array(2);
				}
				else if (poly[i][0] > -32769 && poly[i][0] < 32768 && poly[i][1] > -32769 && poly[i][1] < 32768) {
					points[i] = new Int16Array(2);
				}
				else if (poly[i][0] > -1 && poly[i][1] > -1) {
					points[i] = new Uint32Array(2);
				}					
				else {
					points[i] = new Int32Array(8);
				}
			}
			else {
				points[i] = new Float32Array(8);
			}
			// normals always use float32
			normals[i] = new Float32Array(8);
		}
		else {
			points[i].push(new Array(2));
			normals[i].push(new Array(2));
		}
	}
	
	// store values
	for (i = 0; i < l; i++) {
		points[i][0] = poly[i][0];
		points[i][1] = poly[i][1];
		// clockwise inner 2d line normal
		if (i === l - 1) {
			// special case for last normal since we need the first vertex as the endpoint
			dx = poly[0][0] - poly[i][0];
			dy = poly[0][1] - poly[i][1];
		}
		else {
			dx = poly[i + 1][0] - poly[i][0];
			dy = poly[i + 1][1] - poly[i][1];
		}
		mag = Math.sqrt((dx * dx) + (dy * dy));
		normals[i] = [-dy / mag, dx / mag];
	}
	
	this.points = points;
	this.normals = normals;
	
	this.isPointInside = function(x, y) {
		var coords = points;
		var l = coords.length;
		if (l < 3) {
			xlib.log("Error:    xlib.isPointInPoly() given coordinate array containing less than 3 sets of x,y coords.");
			return false;
		}
		for(var c = false, i = -1, j = l - 1; ++i < l; j = i) {
			((coords[i][1] <= y && y < coords[j][1]) || (coords[j][1] <= y && y < coords[i][1]))
			&& (x < (coords[j][0] - coords[i][0]) * (y - coords[i][1]) / (coords[j][1] - coords[i][1]) + coords[i][0])
			&& (c = !c);
		}
		return c;
	};
	// todo: opt: this should accept an array, object or physicsObject so that we
	// can pass things byref
	// if the aabb is completely inside the poly, returns true. Returns false in
	// all other cases.
	this.isAABBInside = function(x, y, w, h) {
		var
			p = points,
			l = p.length,
			// minus one because of how we step through polygon points in second loop
			i = l - 1,
			lineX2, lineY2,
			r,
			c;

		// check that each aabb point is inside the poly first
		if (!this.isPointInside(x, y)) return false;
		if (!this.isPointInside(x + w, y)) return false;
		if (!this.isPointInside(x + w, y + h)) return false;
		if (!this.isPointInside(x, y + h)) return false;

		// now test each line in the poly to see whether it intersects the aabb edges
		while (i--) {

			// check if the current vertex is inside the aabb
			if (p[i][0] >= x && p[i][0] <= x + w && p[i][1] >= y && p[i][1] <= y + h) return false;

			// avoid addition each time we use the second vertex
			lineX2 = p[i + 1][0];
			lineY2 = p[i + 1][1];

			// is line left of the aabb?
			if (p[i][0] < x && lineX2 < x) continue;
			// is line above the aabb?
			if (p[i][1] < y && lineY2 < y) continue;
			// opt
			var x2 = x + w;
			var y2 = y + h;
			// is line right of aabb?
			if (p[i][0] > x2 && lineX2 > x2) continue;
			// is line below aabb?
			if (p[i][1] > y2 && lineY2 > y2) continue;
		
			// top edge - find x where the line crosses the top edge
			// ((distance from line top to aabb top / total line height) * total line width) + line left edge
			r = (((y - p[i][1]) / (lineY2 - p[i][1])) * (lineX2 - p[i][0])) + p[i][0];
			if (r >= x && r <= x2) {
				return false;
			}
			// bottom edge - find x where the line crosses the bottom edge
			r = (((y2 - p[i][1]) / (lineY2 - p[i][1])) * (lineX2 - p[i][0])) + p[i][0];
			if (r >= x && r <= x2) {
				return false;
			}
			
			// left edge - find y where the line crosses the left edge
			r = (((x - p[i][0]) / (lineX2 - p[i][0])) * (lineY2 - p[i][1])) + p[i][1];
			if (r >= y && r <= y2) {
				return false;
			}
		}
	
		// no need to check right edge since we're looking for a line that passes
		// through the rectangle. It will pass through two of the edges.
		return true;
	}
}

// todo: most of this.
// todo: fix inconsistency with addObject(). Every other store's add* method
// takes params that are passed to a constructor
xlib.physicsStore = {
	// Object groups are independent object collections that don't interact
	// with each other during physics updates and have separate bounding boxes.
	// Example structure of each group array element:
	//   {
	//     name: "rain",
	//     boundingBox: {x,y,z,w,h,d},
	//     objects: [{},...]
	//   }
	groups: {},
	 // Earth's average gravitational force in m/s
	_gravity: 9.80665,
	// used for drag and wind calc; http://en.wikipedia.org/wiki/Drag_%28physics%29#cite_note-2
	_airdensity: 1.293,
	_rad: Math.PI / 180,

	addGroup: function(name, boundingBox3D) {
		if (this.groups[name] !== undefined) {
			xlib.log("Error:    physicsStore.addGroup() couldn't create group with name '" + name + "'; name invalid or already in use.");
			return false;
		}
		var physicsGroup = new this.physicsGroup(name, boundingBox3D);
		if (Object.isEmpty(physicsGroup)) {
			xlib.log("Error:    physicsStore.addGroup() couldn't create group; invalid parameters.");
			return false;
		}
		this.groups[name] = physicsGroup;
		return physicsGroup;
	},
	generatePhysicsPropertiesWithinRange: function(x, y, z, w, h, d, vx, vy, vz, mass, dragCoefficient, restitution) {
		// Creates an array of physics values randomised within a set range.
		// Note that immutable and useAxes are returned in the array but are always
		// set to false and 7 respectively.
		// Each parameter is a single-dimension array containing a min and max value.
		var min = 0, max = 1;
		// position
		x = Math.random() * (x[max] - x[min]) + x[min];
		y = Math.random() * (y[max] - y[min]) + y[min];
		z = Math.random() * (z[max] - z[min]) + z[min];
		// width, height and depth
		w = Math.random() * (w[max] - w[min]) + w[min];
		h = Math.random() * (h[max] - h[min]) + h[min];
		d = Math.random() * (d[max] - d[min]) + d[min];
		// velocity
		vx = Math.random() * (vx[max] - vx[min]) + vx[min];
		vy = Math.random() * (vy[max] - vy[min]) + vy[min];
		vz = Math.random() * (vz[max] - vz[min]) + vz[min];
		// mass
		// todo: right now this represents no mass at 0 and infinite at 1. Change to a real-world unit
		mass = Math.random() * (mass[max] - mass[min]) + mass[min];
		// drag coefficient: a unitless number representing the object's resistance when moving through a fluid.
		// These are calculated through physical tests.
		// Perfectly smooth sphere = .1, Man upright = 1 to 1.3, building = 1.3 to 2.
		// todo: extend to include drag co for each axis.
		dragCoefficient = Math.random() * (dragCoefficient[max] - dragCoefficient[min]) + dragCoefficient[min];
		// restitution: The amount of energy retained upon an impact that changes velocity.
		// Typically between 0 (no energy retained) and 1 (full energy retained).
		restitution = Math.random() * (restitution[max] - restitution[min]) + restitution[min];
		// return an array containing the generated values.
		return [x, y, z, w, h, d, vx, vy, vz, mass, dragCoefficient, restitution, false, 7];
	},
	wrapAngle: function(num) {
		return (num > 360) ? num -= 360 : num;
	}
};

xlib.physicsStore.physicsGroup = function(name, boundingBox3D) {
	// todo: individual gravity, air density etc?
	if (!name || !(boundingBox3D instanceof xlib.boundingBox3D)) {
		xlib.log("Error:    physicsGroup constructor: invalid name or bounding box given. Can't create group.");
		return false;
	}
	this.name = name;
	this.bounds = boundingBox3D;
	this._polygonBoundary = undefined;
	this._polygonBoundaryAxes = 0;
	this.objects = [];
};
// adds a polygon that's used as a vector boundary.
// axes can be one of "xy", "yz", or "xz" to indicate which axis the polyBound
// will apply to. Note that you can't have polyBounds apply to more than one
// axis pair at a time.
// comparisonTransformCallback is a function called before comparing the new
// object positions with the polygon boundary. It can be used to provide a
// transformed set of positions in the case that a game uses a special coord
// system (for example, in pseudo-3d games where an instance's z-position
// affects their vertical position on the screen like SOR). This function is
// sent an array containing the new calculated x,y,z coords, along with a
// reference to the physics object. If the function updates those x,y,z coords,
// they will be used instead when comparing. They will not affect the final
// new x,y,z coords applied to the physics object.
// todo: allow adding multiple polys for complex areas (and exclusion polys?)
xlib.physicsStore.physicsGroup.prototype.set2DPolygonBoundary = function(polygonBoundary, axes) {
	if (!polygonBoundary) {
		xlib.log("Error:    xlib.physicsStore.physicsGroup.set2DpolygonBoundary() given invalid polygonal boundary.");
		return false;
	}
	if (!axes) {
		xlib.log("Error:    xlib.physicsStore.physicsGroup.set2DpolygonBoundary() not given axes parameter.");
		return false;
	}
	switch (axes) {
		case "xy":
			this._polygonBoundaryAxes = 0x3;
			break;
		case "yz":
			this._polygonBoundaryAxes = 0x6;
			break;
		case "xz":
			this._polygonBoundaryAxes = 0x5;
			break;
		default:
			xlib.log("Error:    xlib.physicsStore.physicsGroup.set2DpolygonBoundary() given invalid axes parameter.");
			return false;
	}
	this._polygonBoundary = polygonBoundary;
	return true;
}
// todo: these two functions feel pointless.
xlib.physicsStore.physicsGroup.prototype.setBoundingBox = function(boundingBox3D) {
	if (!(boundingBox3D instanceof xlib.boundingBox3D)) return false;
	// copy the old bounding box
	var old = (this.bounds) ? this.bounds : true;
	// change the bounding box
	this.bounds = boundingBox3D;
	// return the old one
	return old;
};
xlib.physicsStore.physicsGroup.prototype.getBoundingBox = function() {
	return this.bounds;
};
xlib.physicsStore.physicsGroup.prototype.addObject = function(physicsObject) {
	// add the physics object to the array and return an identifier.
	var objects = this.objects;
	// add a ref to the physics group. This is hacky but we can't reach up a
	// non-existent object heirachy. Knowing which group an physics object belongs
	// to is useful elsewhere.
	physicsObject.group = this;
	var len = objects.push(physicsObject);
	return len - 1;
};
xlib.physicsStore.physicsGroup.prototype.updatePhysics = function(fps) {
	// step through all the physics objects and calculate changes to their
	// properties.
	// todo: most of this, including collisions

	// early exit
	var i = this.objects.length;
	if (!i) return true;

	// temp: hack: todo: remove the gravity kludge, somehow
	// todo: gravity should be a vector so it's a direction that can be changed.
	var
		g = xlib.physicsStore._gravity * 47,
		objects = this.objects,
		// current object in loop
		o,
		// boundaries coords common to all objects in group
		bx = this.bounds.x,
		by = this.bounds.y,
		bz = this.bounds.z,
		bw = this.bounds.w,
		bh = this.bounds.h,
		bd = this.bounds.d,
		// temporary variables that hold new object positions during boundary testing
		newX,
		newY,
		newZ,
		polyAxes = this._polygonBoundaryAxes;

	while (i--) {
		// skip the object altogether if we can't do anything to it
		if (objects[i].immutable) continue;
		o = objects[i];

		// todo: this physics/collision code is completely fucked. Axes should not
		// be updated independently -- the movement vector should be collision
		// tested to find which axis collided first. Replace this entire function
		// with the new physics code being built.

		// calc new acceleration and positions for each axis
		// note: only y has gravity applying atm, see gravity vector todo above
		if ((o.useAxes & 1) === 1) {
			newX = o.x + o.vx / fps;
		}
		else {
			newX = o.x;
		}
		
		if ((o.useAxes & 2) === 2) {
			o.vy += g / fps;
			newY = o.y + o.vy / fps;
		}
		else {
			newY = o.y;
		}
		
		if ((o.useAxes & 4) === 4) {
			newZ = o.z + o.vz / fps;
		}
		else {
			newZ = o.z;
		}
		// use boundary box collision detection if a polygon boundary isn't set

		if ((o.useAxes & 1) === 1 && (polyAxes & 1) === 0) {
			// boundary: x left
			if (newX < bx) {
				// collision detected; reflect on x axis
				o.vx *= o.restitution;
				newX = newX - (newX - bx);
			}
			// boundary: x right
			if (newX + o.w > bx + bw) {
				// collision detected; reflect on x axis
				o.vx *= o.restitution;
				newX = newX - (newX + o.w - (bx + bw));
			}
		}
		if ((o.useAxes & 2) === 2 && (polyAxes & 2) === 0) {
			// acceleration due to gravity
			o.vy += (g / fps);
			// boundary: y top
			if (newY < by) {
				// collision detected; reflect on y axis
				o.vy *= o.restitution;
				newY = newY - (newY - by);
			}
			// boundary: y bottom
			if (newY + o.h > by + bh) {
				// collision detected; reflect on y axis
				o.vy *= o.restitution;
				newY = newY - (newY + o.h - (by + bh));
			}
		}
		if ((o.useAxes & 4) === 4 && (polyAxes & 4) === 0) {
			// boundary: z front
			if (newZ < bz) {
				// collision detected; reflect on z axis
				o.vz *= o.restitution;
				newZ = newZ - (newZ - bz);
			}
			// boundary: z back
			if (newZ + o.d > bz + bd) {
				// collision detected; reflect on z axis
				o.vz *= o.restitution;
				newZ = newZ - (newZ + o.d - (bz + bd));
			}
		}
		
		// use polygonal boundary test for axes that have a polygon set
		
		// todo: now: we don't deflect objects that overlap the polygon boundary
		// like we do above. This will require calculating the deflection vector
		// and updating the two axes together.
		// see http://xnawiki.com/index.php?title=Vector_Math

		if ((polyAxes & 1) === 1 && (polyAxes & 2) === 2) {
				// xy
				if (!this._polygonBoundary.isAABBInside(newX, newY, o.w, o.h)) {
					// can't move to new position -- its out of bounds. Use the old pos.
					// todo: we should move as close to the polygon edge as possible, and/or
					// apply a deflection the same way we do in the code above.
					newX = o.x;
					newY = o.y;
				}
		}
		if ((polyAxes & 2) === 2 && (polyAxes & 4) === 4) {
				// yz
				if (!this._polygonBoundary.isAABBInside(newY, newZ, o.h, o.d)) {
					newY = o.y;
					newZ = o.z;
				}
		}
		if ((polyAxes & 1) === 1 && (polyAxes & 4) === 4) {
				// xz
				if (!this._polygonBoundary.isAABBInside(newX, newZ, o.w, o.d)) {
					newX = o.x;
					newZ = o.z;
				}
		}
		
		// apply final new positions
		o.x = newX;
		o.y = newY;
		o.z = newZ;

		// additional code if it's a particle
		//if (o instanceof xlib.physicsStore.physicsParticle) { // todo: why doesn't this work?
		if (o.colour !== undefined) {
			if (o.tickLifeTime === 0) {
				// if the destroy function is set, run it
				if (!o.beforeDestroyFunction || o.beforeDestroyFunction()) {
					objects.splice(i, 1);
				}
				continue;
			}
			// todo: do extra particle stuff.
			// colour and animInstance aren't used until drawing.
			// reduce lifetime. The particle is destroyed when this reaches 0.
			// run afterUpdate() now
			if (o.afterUpdateFunction) {
				o.afterUpdateFunction();
			}
			// don't bother with tickLifeTime unless it's set to a number
			if (typeof o.tickLifeTime === "number") {
				o.tickLifeTime--;
			}
		}
	}
	return true;
};

/******* testing ********/

// this is intended to replace updatePhysics(). Several aspects of the original
// function are currently missing, such as working with the physicsGroup
// boundary and applying the polygonBoundary to specific axes. It currently
// assumes that the polygonBoundary always applies to x/y, whereas it's
// configurable in the other version.
// When finished, this code will allow characters to move against the edge of
// the stage without getting stuck and bounce off non-axis-aligned walls
// realistically. Note several todos.

xlib.physicsStore.physicsGroup.prototype.updatePhysics2 = function(fps) {

	var
		g = xlib.physicsStore._gravity * 47 / fps,
		collisions = [], // stores the earliest collisions
		collisionTime = 1, // decimal fraction of second until earliest collisions
		remainingTime = 1 / fps, // remaining time left for processing (decimal fraction of second)
		movementTime = 0, // movement time applied (decimal fraction of second)
		runs = 0, // number of runs of the main loop, used to avoid physics DOS to the framerate
		b = this._polygonBoundary, // plural?
		objects = this.objects,
		objectsLen = objects.length,
		// counters, convenience refs, etc
		i,
		j,
		o,
		vx, vy,
		vertices = [],
		// returned values from getIntersectLine
		r = [0, 0, 0, 0],
		// deflected vector
		d = [];

	// add gravity pull to each object
	i = objectsLen;
	while (i--) {
		objects[i].vy += g;
	}

	while (remainingTime && runs < 10) {

		i = objectsLen;
		while (i--) {
			o = objects[i];
			// box vertices used later for loop j. Clockwise order.
			vertices = [[o.x, o.y], [o.x + o.w, o.y], [o.x + o.w, o.y + o.h], [o.x, o.y + o.h]];
			vx = o.vx / fps;
			vy = o.vy / fps;
			j = 4;
			// step through each vertex on the object and find whether its
			// projected velocity vector intersects with a poly line.
			// If it does, we'll receive the decimal fraction of the
			// velocity vector's length, the poly line's first and second
			// point, and the line normal. If the fraction of remaining
			// time is less than the one we've stored in collisionTime,
			// wipe collisions and store this object as the new collision.
			// If the time is exactly the same (eg. two aabb colliding
			// with a parallel poly line) then add the object to the
			// collision array instead of replacing.
			while (j--) {
				if (b.getIntersectLine(vertices[j][0], vertices[j][1], vertices[j][0] + vx, vertices[j][1] + vy, r)) {
					if (r[0] < collisionTime) {
						// replace existing collisions with new one.
						collisionTime = r[0];
						collisions.length = 0;
						collisions[0] = [o, r[1], r[2], r[3]];
					}
					else if (r[0] === collisionTime) {
						// add new collision to the existing set.
						collisions.push([o, r[1], r[2], r[3]]);
					}
				}
			}
			
			// The same test must then be done for the points in the poly
			// line to see if they collide with the lines of the aabb,
			// otherwise a box that's moving downwards could be impaled
			// by an upwards-facing spike on the poly.
			
			// Processing these immediate collisions is done later.
		}

		// todo: loop, same as above, for aabb/aabb collision

		// new movement time depends on whether a collision was found
		movementTime = remainingTime * collisionTime;
		// process movement. We step through all objects and move them
		// by the movementTime * their velocities.
		i = objectsLen;
		while (i--) {
			o = objects[i];
			o.x += movementTime * o.vx;
			o.y += movementTime * o.vy;
			o.z += movementTime * o.vz;
		}

		// process collisions. We step through the collisions array and
		// apply the velocity changes based on the object's physics
		// properties and the normal of what they collided with.
		i = collisions.length;

		while (i--) {
			c = collisions[i];
			d = xlib.v2CalculateDeflection(
				[c[0].vx, c[0].vy],
				c[0].restitution,
				[c[3][0], c[3][1]]
			)
			// update original velocities
			c[0].vx = d[0];
			c[0].vy = d[1];
			// hack: avoid numerical imprecision problems that cause the
			// object to become trapped over the poly line by moving the
			// object very slightly in the direction of the normal.
			d = xlib.v2Mul(.0000001, [c[3][0], c[3][1]]);
			c[0].x += d[0];
			c[0].y += d[1];
		}

		runs++;
		collisions.length = 0;
		
		// reduce the remaining time by the amount we moved
		remainingTime -= movementTime;
	}
};

xlib.polygonBoundary.prototype.getIntersectLine = function(x1, y1, x2, y2, arrayResult) {
	// if the provided line intersects with any of the poly's lines,
	// find which poly line it hit first, store the following info
	// in arrayResult:
	//   - the decimal fraction of the line before collision (float),
	//   - the poly line's first vertex (array(2) of varying number types),
	//   - the poly line's second vertex (array(2) of varying number types),
	//   - the poly line's normal (array(2) of float),
	// and then return true.
	// Return false if there was no intersection. Note that the values
	// inside arrayResult will be nonsensical in that case.
	// x1,y1 is assumed to be the origin, so the fraction will be
	// calculated from that position.
	var
		p = this.points,
		n = this.normals,
		i = p.length - 1,
		polyLineIndex, // index to the first vertex in the poly line of the collision
		r = [0, 0, 0, 0],
		getIntersectLineLine = xlib.getIntersectLineLine;

	// first element is the decimal fraction of line's length. The
	// value set here is intentially invalid so that it will be
	// overwritten with the first collision found.
	arrayResult[0] = 2;

	// special case: last poly line uses last and first vertex
	if (getIntersectLineLine(x1, y1, x2, y2, p[i][0], p[i][1], p[0][0], p[0][1], r)) {
		if (r[0] < arrayResult[0]) {
			// found a collision that's earlier than the existing.
			arrayResult[0] = r[0];
			arrayResult[1] = p[i];
			arrayResult[2] = p[0];
			arrayResult[3] = n[i];
		}
	}
	// rest of the poly lines
	while (i--) {
		// test the line against each poly line
		if (getIntersectLineLine(x1, y1, x2, y2, p[i][0], p[i][1], p[i + 1][0], p[i + 1][1], r)) {
			if (r[0] < arrayResult[0]) {
				// found a collision that's earlier than the existing.
				arrayResult[0] = r[0];
				arrayResult[1] = p[i];
				arrayResult[2] = p[i + 1];
				arrayResult[3] = n[i];
			}
		}
	}
	if (arrayResult[0] !== 2) return true;
	return false;
};

// these are all horrific performance and memory-wise. Optimise to allow passing
// physics objects as is, and optionally modify a passed array in place

xlib.v2Dot = function(a, b) {
	return a[0] * b[0] + a[1] * b[1];
};
xlib.v2Add = function(a, b) {
	return [a[0] + b[0], a[1] + b[1]];
};
xlib.v2Mul = function(a, b) {
	if (a.length) {
		return (b.length) ? [a[0] * b[0], a[1] * b[1]] : [a[0] * b, a[1] * b];
	}
	else {
		return (b.length) ? [a * b[0], a * b[1]] : [a * b, a * b];
	}
};


xlib.v3Dot = function(a, b) {
	return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}
xlib.v3Add = function(a, b) {
	return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
};
xlib.v3Mul = function(a, b) {
	return [a[0] * b[0], a[1] * b[1], a[2] * b[2]];
	if (a.length) {
		return (b.length) ? [a[0] * b[0], a[1] * b[1], a[2] * b[2]] : [a[0] * b, a[1] * b, a[2] * b];
	}
	else {
		return (b.length) ? [a * b[0], a * b[1], a * b[2]] : [a * b, a * b, a * b];
	}
};


xlib.v3CalculateDeflection = function(currentVelocity, elasticity, collisionNormal) {
	var r = -2 * xlib.v3Dot(currentVelocity, collisionNormal);
	r = xlib.v3Mul(r, collisionNormal);
	r = xlib.v3Add(r, currentVelocity)
	r = xlib.v3Mul(r, [elasticity, elasticity, elasticity]);
	return r;
};

xlib.v2CalculateDeflection = function(currentVelocity, elasticity, collisionNormal) {
	var r = -2 * xlib.v2Dot(currentVelocity, collisionNormal);
	r = xlib.v2Mul(r, collisionNormal);
	r = xlib.v2Add(r, currentVelocity)
	r = xlib.v2Mul(r, [elasticity, elasticity]);
	return r;
};

/******* /testing *******/

xlib.physicsStore.physicsObject = function(x, y, z, w, h, d, vx, vy, vz, mass, dragCoefficient, restitution, immutable, useAxes) {
	// Creates a new physics object.
	// All parameters are floats except for:
	//   immutable (boolean)
	//   useAxes   (bitwise value; bit 1 = x, 2 = y, 3 = z)
	//              useAxes can be used to disable physics for particular axes.
	var i;

	// validate the first 12 arguments to make sure they're numbers
	for (i = 0; i < 12; i++) {
		// naive checking, but who really instantiates numbers the other way
		if (typeof arguments[i] !== 'number') return false;
	}
	if (typeof immutable !== 'number') {
		immutable = 0;
	}
	if (useAxes === undefined) {
		useAxes = 7;
	}

	this.x = x;
	this.y = y;
	this.z = z;
	this.w = w;
	this.h = h;
	this.d = d;
	this.vx = vx;
	this.vy = vy;
	this.vz = vz;
	this.mass = mass;
	this.dragCoefficient = dragCoefficient;
	this.restitution = restitution;
	this.immutable = immutable;
	this.useAxes = useAxes;
};
// obscene argument list ahoy
xlib.physicsStore.physicsParticle = function(x, y, z, w, h, d, vx, vy, vz, mass, dragCoefficient, restitution, immutable, useAxes, colour, opacity, animInstance, tickLifeTime, afterUpdateFunction, beforeDestroyFunction) {
	xlib.physicsStore.physicsObject.call(this, x, y, z, w, h, d, vx, vy, vz, mass, dragCoefficient, restitution, immutable, useAxes);
	this.colour = colour;
	this.opacity = opacity;
	this.animInstance = animInstance;
	this.afterUpdateFunction = afterUpdateFunction;
	this.beforeDestroyFunction = (typeof beforeDestroyFunction === "undefined") ? this.particleBeforeDestroyGeneric : beforeDestroyFunction;
	this.tickLifeTime = tickLifeTime;
};
xlib.physicsStore.physicsParticle.prototype = new xlib.physicsStore.physicsObject();

// the standard 'beforeDestroy' function for particles.
xlib.physicsStore.physicsParticle.prototype.particleBeforeDestroyGeneric = function() {
	// if this is the first time destroy is called for this particle, set a
	// tick length for its destruction. We'll decrement this number and when it
	// reaches 0, we pass back true to the caller and the particle is destroyed.
	if (this._destroyTicks === undefined) {
		this._destroyTicks = 60;
	}
	this._destroyTicks--;
	if (this._destroyTicks === 0) return true;
	// flash the particle by toggling opacity every three ticks
	if (this._destroyTicks % 3 === 0) {
		this.opacity = (this.opacity === 0) ? 1 : 0;
	}
	return false;
};

xlib.actorStore = {
	actors: {},
	instances: {},
	_actionBufferLength: 15,
	addActor: function(name, stateMachine, actorConstants, sequenceList) {
		// early exits
		if (this.actors[name] !== undefined) {
			xlib.log("Error:    addActor() can't add actor with name '" + name + "'; name is invalid or already exits.");
			return false;
		}
		var actor = new this.actor(name, stateMachine, actorConstants, sequenceList);
		if (Object.isEmpty(actor)) {
			xlib.log("Error:    addActor() couldn't create actor '" + name + "'.");
			return false;
		}
		// add to our store.
		this.actors[name] = actor;
		return actor;
	},
	getInstanceDrawList: function() {
		var xlib = window.xlib;
		var instances = this.instances;
		var instance, physics, drawList = [], currentFrame, axisFlip, destX, destY;
		var j = 0;
		var i;
		// step through all actor instances
		for (i in instances) {
			instance = instances[i];
			physics = instance.physics;
			axisFlip = instance.axisFlip;

			// todo: quit if the instance doesn't want to be drawn. Could be for
			// a variety of reasons, including a disabled flag or the instance
			// being completely off screen

			// skip the instance if it doesn't have an animInstance. This can happen
			// when the state machine hasn't been run on an instance yet.
			if (!instance.animInstance) continue;
			
			// get the current image, frameBounds and dest bounds for the instance
			// todo: see note in actorStore.createInstance() about axisFlip
			currentFrame = instance.animInstance.getCurrentFrame(instance.animTick);
			if (currentFrame === false) {
				xlib.log("Error:    getInstanceDrawList() couldn't get frame from animStore.getCurrentFrame() for instance '" + i + "'. Instance object:");
				xlib.log(instances[i]);
				continue;
			}

			currentFrame = currentFrame.getFlippedVersion(axisFlip);

			if (currentFrame === false) {
				xlib.log("Error:    getInstanceDrawList() couldn't get flipped frame from animFrame.getFlippedVersion() for instance '" + i+ "'. Instance object:");
				xlib.log(instances[i]);
			}

			// calc destination x and y
			switch (axisFlip) {
				case 0:
					destX = Math.floor(physics.x) - currentFrame.imageFrameRect.ox;
					destY = Math.floor(physics.y) - currentFrame.imageFrameRect.oy;
					break;
				case 1:
					destX = Math.floor(physics.x + physics.w - currentFrame.imageFrameRect.w) - currentFrame.imageFrameRect.ox;
					destY = Math.floor(physics.y) - currentFrame.imageFrameRect.oy;
					break;
				case 2:
					destX = Math.floor(physics.x) - currentFrame.imageFrameRect.ox;
					destY = Math.floor(physics.y + physics.w - currentFrame.imageFrameRect.h) - currentFrame.imageFrameRect.oy;
					break;
				case 3:
					destX = Math.floor(physics.x + physics.w - currentFrame.imageFrameRect.w) - currentFrame.imageFrameRect.ox;
					destY = Math.floor(physics.y + physics.w - currentFrame.imageFrameRect.h) - currentFrame.imageFrameRect.oy;
					break;
			}

			// build the drawQueue element
			drawList[j] = [
				0, // image
				physics.z + instance.drawOffset.z,
				currentFrame.image.source,
				currentFrame.imageFrameRect,
				destX + instance.drawOffset.x,
				destY + instance.drawOffset.y,
				// todo: these don't accomodate scaling if we introduce it later
				currentFrame.imageFrameRect.w,
				currentFrame.imageFrameRect.h,
				instance.opacity
			];

			// move to the next drawlist element
			j++;
		}
		return drawList;
	},

	// find collisions between all active actor instances by comparing the
	// collision boxes that belong to their current animation frame.
	// findType and inType specify the two types of collision boxes to compare.
	// filterFunc is a user function used to filter the collision results. It's
	// useful when a game only wants collisions on instances with an unrelated
	// property set on one or both instances, or when a 2.5D game needs to filter
	// collisions based on a virtual z-axis. If the user function returns false
	// then the collision is dropped and not included in the array. If it returns
	// true then the collision is included.
	// getOverlap is a boolean that determines whether a bounding box containing
	// the overlapping area of the two boxes is stored at the end of the new
	// collision array element. If set to false (the default) the array element
	// will be undefined.
	// Returns an array of instances with collision boxes of type againstType
	// where a collision was detected. For example, if findType is 1 (hitBox) and
	// inType is 0 (bodyBox) then an array of instances with bodyBox
	// collision boxes will be returned.
	// Return format:
	//   [
	//     [instanceRef, [collisionBoxIndex, collisionBoxIndex, ...],
	//     [instanceRef, [collisionBoxIndex, collisionBoxIndex, ...],
	//   ]
	// todo: remove local references to simple this.whatever props and objects.
	findInstanceCollisions: function(findType, inType, filterFunction, getOverlap) {
		// todo: optimise collision detection by sorting instances into "zones"
		// first, then running detection only on instances inside the same zone
		if (findType === undefined || inType === undefined) return false;
		var xlib = window.xlib;
		var instances = this.instances;
		var instanceFind, instanceIn;
		var physicsFind, physicsIn;
		var animFrameFind, animFrameIn;

		// i is the outer loop -- stepping through each instance with collisionBoxes of type findType.
		var i;
		// j is inner loop 1 -- stepping through each instance with collisionBoxes of type inType.
		var j;
		// k is inner loop 2 -- stepping through each collisionBox in i.
		var k;
		// l is inner loop 3 -- stepping through each collisionBox in j.
		var l;
		// convenience variables for skipping property lookups
		var boxesFind, boxesIn;
		// temp vars for collision box x and y after aligning to their actors
		var x1, y1, x2, y2;

		// step through each instance
		for (i in instances) {
			instanceFind = instances[i];
			// reset the collision array
			instanceFind.collisionsThisTick = [];
			// grab the appropriate object containing the collision boxes
			// early exit: if there's no animation, there's no collision boxes
			if (!instanceFind.animInstance) continue;
			// get the appropriate animation frame frame for the instance's animTick
			animFrameFind = instanceFind.animInstance.getCurrentFrame(instanceFind.animTick);
			boxesFind = (findType === 0) ? animFrameFind.bodyBoxes : animFrameFind.hitBoxes;
			// if this instance doesn't have collision boxes of type findType, skip
			if (!boxesFind.length) continue;
			// convenience var used down in the k loop
			physicsFind = instanceFind.physics;
			// step through each instance
			for (j in instances) {
				// if we're comparing the same instance, skip
				if (i === j) continue;
				instanceIn = instances[j];
				// grab the appropriate object containing the collision boxes
				// early exit: if there's no animation, there's no collision boxes
				if (!instanceIn.animInstance) continue;
				animFrameIn = instanceIn.animInstance.getCurrentFrame(instanceIn.animTick);
				boxesIn = (inType === 0) ? animFrameIn.bodyBoxes : animFrameIn.hitBoxes;
				// if this instance doesn't have collision boxes of type findType, skip
				if (!boxesIn.length) continue;
				// convenience var used down in the l loop
				physicsIn = instanceIn.physics;
				// reset k to the last box in boxesFind
				k = boxesFind.length;
				innerloopl:
				while (k--) {
					// get the position of the 'find' collision box relative to the
					// instance position. This may require flipping the collision box's
					// coordinates if the instance is flipped (facing an alternate
					// direction from the original).
					switch (instanceFind.axisFlip) {
						case 0:
							x1 = Math.round(physicsFind.x) + boxesFind[k].x;
							y1 = Math.round(physicsFind.y) + boxesFind[k].y;
							break;
						case 1:
							x1 = Math.round(physicsFind.x + physicsFind.w) - boxesFind[k].x - boxesFind[k].w;
							y1 = Math.round(physicsFind.y) + boxesFind[k].y;
							break;
						case 2:
							x1 = Math.round(physicsFind.x) + boxesFind[k].x;
							y1 = Math.round(physicsFind.y + physicsFind.h) - boxesFind[k].y - boxesFind[k].h;
							break;
						case 4:
							x1 = Math.round(physicsFind.x + physicsFind.w) - boxesFind[k].x - boxesFind[k].w;
							y1 = Math.round(physicsFind.y + physicsFind.h) - boxesFind[k].y - boxesFind[k].h;
							break;
					}
					// reset l to the last box in boxesIn
					l = boxesIn.length;
					while (l--) {
						// get the position of the 'find' collision box relative to the
						// instance position. See note above.
						switch (instanceIn.axisFlip) {
							case 0:
								x2 = Math.round(physicsIn.x) + boxesIn[l].x;
								y2 = Math.round(physicsIn.y) + boxesIn[l].y;
								break;
							case 1:
								x2 = Math.round(physicsIn.x + physicsIn.w) - boxesIn[l].x - boxesIn[l].w;
								y2 = Math.round(physicsIn.y) + boxesIn[l].y;
								break;
							case 2:
								x2 = Math.round(physicsIn.x) + boxesIn[l].x;
								y2 = Math.round(physicsIn.y + physicsIn.h) - boxesIn[l].y - boxesIn[l].h;
								break;
							case 4:
								x2 = Math.round(physicsIn.x + physicsIn.w) - boxesIn[l].x - boxesIn[l].w;
								y2 = Math.round(physicsIn.y + physicsIn.h) - boxesIn[l].y - boxesIn[l].h;
								break;
						}

						// finally, compare something.
						// note: code stolen from boundingBox2D.intersect() to avoid
						// function call overhead.
						if (x2 > x1 + boxesFind[k].w ||
						    x2 + boxesIn[l].w < x1 ||
						    y2 > y1 + boxesFind[k].h ||
						    y2 + boxesIn[l].h < y1) continue;
						// found a collision. Check it against the user function if one is set.
						if (filterFunction && !filterFunction(instanceFind, k, instanceIn, l)) continue;
						// Make a new array element containing the current instanceFind and
						// its current collision box plus the current instanceIn and its
						// current collision box. Add it to the collisions array.
						// If the caller requested the overlap box, include it too.
						if (!getOverlap) {
							instanceFind.collisionsThisTick.push([boxesFind[k], instanceIn, boxesIn[l]]);
						}
						else {
							instanceFind.collisionsThisTick.push([
								boxesFind[k],
								instanceIn,
								boxesIn[l],
								new xlib.boundingBox2D(Math.max(x1, x2),
							                         Math.max(y1, y2),
							                         Math.min(x1 + boxesFind[k].w, x2 + boxesIn[l].w) - Math.max(x1, x2),
							                         Math.min(y1 + boxesFind[k].h, y2 + boxesIn[l].h) - Math.max(y1, y2))
							]);
						}
					} // move onto the next instanceIn collision box.
				} // move onto the next instanceFind collision box.
			} // move onto the next instanceIn.
		} // move onto the next instanceFind.

		return true;
	},

	// sets the number of ticks to remember unused actions for, essentially
	// allowing users to enter input sequences before the action can be used.
	// The higher the tick count, the more lenient the system is towards actions
	// entered too early.
	// todo: convert this and other suitable properties to get/set syntax
	setActionBufferLength: function(ticks) {
		if (typeof ticks !== "number" || !ticks) {
			xlib.log("Error:    actorStore.setActionBufferLength() given invalid tick parameter. Must be a number between 1 and 120.");
			return false;
		}
		this._actionBufferLength = ticks;
		return true;
	}
};
xlib.actorStore.defaultActorConstants = {
	// When creating an actor, an actorConstants object is passed
	
	// An actorConstants object defines properties of an actor such as its width,
	// height, movement speeds, animations, audio effects, etc. An actorConstants
	// object must be passed to the actor constructor function.
	// The default values here are used in the case that a property is missing
	// from the actorConstants object passed to the constructor. Note that while
	// this list contains all the required properties, it doesn't include all the
	// values that are required for a useful, visible actor (eg. animations).
	// Those values are typically unique for each actor.

	// This object may be added to or replaced dynamically, but changes will only
	// have effect on new actors and not existing ones.
	
	hitPoints             : 1000,
	width                 : 10,
	height                : 10,
	depth                 : 10,
	 // bitwise flags that specify which directions the instance can face
	directionsAllowed     : xlib.INSTANCEDIRECTION_RIGHT,
	moveSpeedX            : 67.5,
	moveSpeedY            : 45,
	moveSpeedZ            : 45,
	jumpSpeedX            : 94.5,
	jumpSpeedY            : 292.5,
	jumpSpeedY            : 0,
	knockoutSpeedX        : 135,
	knockoutSpeedY        : -315,
	knockoutSpeedZ        : 0,
	hitPause              : 5,
	getHitPause           : 30,
	getHitFallPause       : 6,
	restTicks             : 24,
	audioHitGround        : null, // string, eg. "hit_ground", referring to named audio sample
	audioGetHitLight      : null,
	audioGetHitStrong     : null,
	audioGetHitFierce     : null,
	audioGetHitKnockdown  : null,
	audioGetHitWeaponBlunt: null,
	audioGetHitWeaponSlash: null,
	audioGetHitWeaponStab : null, 
	audioKnockout         : null,
	animIdle              : null, // string, eg. "char_axel_idle", referring to a named animation
	animMove              : null,
	animJumpStart         : null,
	animJumpRise          : null,
	animJumpFall          : null,
	animJumpLand          : null,
	animGetHitHigh        : null,
	animGetHitLow         : null,
	animFall              : null,
	animRest              : null,
	animGetUp             : null,
	animKnockout          : null,
	// animCollapse?
	animsHitsparks        : null, // array of strings, eg. ["hitspark_jab", "hitspark_strong", "hitspark_fierce"],
	                              // referring to named animations, ordered by strength of hit

};
xlib.actorStore.actor = function(name, stateMachine, actorConstants, sequenceList) {
	// an actor is a template for an object in the game world. It defines the
	// animations, sounds, hitboxes etc, but isn't directly usable until we
	// create an instance of it with state and physics properties.
	//
	// actorConstants is a JSON object containing the basic information about
	// the actor that can be used within the state machine.
	// See actorStore.actorConstantDefaults for more info.

	var p, i, len;
	for (p in xlib.actorStore.defaultActorConstants) {
		// skip if the property is on the defaultActorConstants prototype or it
		// already exists in actorConstants
		if (xlib.actorStore.defaultActorConstants.hasOwnProperty(p) && !actorConstants.hasOwnProperty(p)) {
			// if the property is an array, copy the elements individually to avoid
			// copying the array's object reference.
			if (Array.isArray(xlib.actorStore.defaultActorConstants[p])) {
			//if (Object.prototype.toString.call(xlib.actorStore.defaultActorConstants[p]) === '[object Array]') {
				len = xlib.actorStore.defaultActorConstants[p].length;
				actorConstants[p] = [];
				for (i = 0; i < len; i++) {
					actorConstants[p].push(xlib.actorStore.defaultActorConstants[p][i]);
				}
			}
			else {
				actorConstants[p] = xlib.actorStore.defaultActorConstants[p];
			}
		}
	}

	/*
	// todo: add more properties
	damage modifiers, etc
	palettes? hard to do, but possible by modifying the png palette in a data url
	*/
	// todo: more validation here
	if (!name || !stateMachine || !stateMachine.resolver || !stateMachine.processor) {
		xlib.log("Error:    actor constructor: invalid name or state machine passed. Couldn't create new actor '" + name + "'.");
		return false;
	}

	this.name = name;
	this.stateMachine = stateMachine;
	this.actorConstants = (actorConstants) ? actorConstants : {};
	this.sequenceList = (sequenceList) ? sequenceList : [];
};
xlib.actorStore.actor.prototype.createInstance = function(name, physicsObject) {
	// todo: find out why physicsObject instanceof physicsStore.physicsObject === false
	// alert(physicsObject.__proto__);
	// early exit
	if (xlib.actorStore.instances[name] !== undefined) {
		xlib.log("Error:    actor.createInstance(): couldn't create actor instance '" + name + "'; name invalid or already in use.");
		return false;
	}
	var instance = new xlib.actorStore.actorInstance(this, name, physicsObject);
	if (Object.isEmpty(instance)) {
		xlib.log("Error:    actor.createInstance(): couldn't create actor instance '" + name + "'; invalid parameters.");
		return false;
	}
	xlib.actorStore.instances[name] = instance;
	return instance;
};
xlib.actorStore.actorInstance = function(actor, name, physicsObject) {
	// each instance is an instantiated object. This lets us use prototype
	// later to create an object that inherits the current properties of the
	// actor instance and pass that to the state machine instead of the
	// original object. The new object can then be modified by the state
	// machine functions without destroying the original values, and copying
	// each individual property to a new object isn't necessary.
	// todo: see notes about using a proxy object in runStateMachines().

	// note: actors must always have an idle state (id 0) for use when
	// nothing else is happening.

	// Many of these properties will be filled out by the state machine next
	// time we call runStateMachines().

	if (!name || !actor || !physicsObject) {
		xlib.log("Error:    actorInstance constructor: invalid parameters. Couldn't create actor instance for actor name: '" + name + "', actor: " + actor.name);
		return false;
	}
	
	var xlib = window.xlib;

	// internal instance name, eg. jojo. Not intended for display in the UI.
	this.name = name;
	// user-visible name, intended for display in the UI.
	this.displayName = actor.name;
	// makeStateChangesPending flag. When true, changes to stateId and stateTick
	// don't update those properties but instead update their "pending" versions.
	// The pending changes are applied next time the state machine runs on the
	// instance. This is intended as a way to prohibit state machine processors
	// from making instant state changes. Only resolvers are allowed to do that.
	this.makeStateChangesPending = false;
	// the actor template used for this instance.
	this.actor = actor;
	// id of the current instance state. Private prop with public setter/getter.
	var _stateId = 0;
	Object.defineProperty(this, "stateId", {
		get: function() {
			return _stateId;
		},
		set: function(id) {
			// which properties we update depends on the makeStateChangesPending flag.
			if (!this.makeStateChangesPending) {
				// store the existing stateId before updating it.
				this.previousStateId = _stateId;
				_stateId = id;
				// Reset stateTick to 0.
				_stateTick = 0;
				// clear existing commands that don't want to be span across state
				// changes. This removes existing hits, state freezes, etc.
				var commands = this.commands;
				var i = commands.length;
				while (i--) {
					if (!commands[i].persistThroughStateChange) commands.splice(i, 1);
				}
			}
			else {
				// store values in "pending" properties instead.
				this.pendingStateId = id;
				this.pendingStateTick = 0;
			}
		}
	});
	// length of time spent in this state, measured in game ticks. Private prop
	// with public setter/getter.
	// note: This property is intended to be used for resetting an existing state
	// or shifting to a specific stateTick. Don't use it when incrementing
	// stateTick by one in a game loop or runStateMachines() as it also resets
	// commands, destroying existing hits. Use this.advanceStateTick() instead.
	var _stateTick = 0;
	Object.defineProperty(this, "stateTick", {
		get: function() {
			return _stateTick;
		},
		set: function(tick) {
			// which properties we update depends on the makeStateChangesPending flag.
			if (!this.makeStateChangesPending) {
				// store the existing stateTick before updating it.
				this.previousStateTick = _stateTick;
				_stateTick = tick;
				// clear existing commands that don't want to be span across state
				// changes. This removes existing hits, state freezes, etc.
				var commands = this.commands;
				var i = commands.length;
				while (i--) {
					if (!commands[i].persistThroughStateChange) commands.splice(i, 1);
				}
			}
			else {
				// store values in "pending" properties instead.
				this.pendingStateTick = tick;
			}
		}
	});
	// todo: find a better way to avoid clearing the commands.
	this.advanceStateTick = function() {
		// store the existing stateTick before updating it.
		this.previousStateTick = _stateTick;
		_stateTick++;
	};
	// previous instance state info
	this.previousStateId = null;
	this.previousStateTick = null;
	this.previousAnimTick = null;
	// particles applicable to this instance
	this.particleGroup = null;
	// todo: create constants for type, eg. controllable, decorative
	this.type = 0;
	// visual opacity of the instance. This is separate from any alpha channels
	// stored in the animation's images. The final opacity of the animation frame
	// drawn to the screen will be determined by multiplying the two values.
	this.opacity = 1;
	// offsets for the position the instance is drawn. Purely visual; to be used
	// only during drawing. Does not affect physics or collision.
	this.drawOffset = {
		x: 0,
		y: 0,
		z: 0
	};
	// the current animation instance object. This is used to fetch the
	// appropriate animation frame when rendering. animInstance contains an
	// object reference to the anim object as well.
	this.animInstance = null;
	// name of the current animation used for the instance.
	// private var and public getter/setter for current instance animation
	var _animName = null;
	Object.defineProperty(this, "animName", {
		get: function() {
			return _animName;
		},
		set: function(name) {
			// early exit if setting during frozen state
			if (this._freezeStateTick) return;
			// ensure the anim exists. If it doesn't, reset animName to the actor's
			// idle anim.
			if (!xlib.animStore.anims[name]) {
				xlib.log("Warning:  invalid animName '" + name + "' set for instance " + this.name + ", state " + this.stateId + ". Check that animName is correct in state machine. If you're using a actorConstant, ensure it's spelt correctly and has been set for the actor.");
				name = this.actor.actorConstants.animIdle;
			}
			_animName = name;
			// create and store the new animInstance. It doesn't matter what we
			// provide for the offset since we're always supplying animTick to any
			// calls to getCurrentFrame() on an instance.
			this.animInstance = xlib.animStore.anims[_animName].createAnimInstance(0);
			// reset animTick
			this.animTick = 0;
		}
	});
	// time spent in the current animation, measured in game ticks.
	var _animTick = 0;
	Object.defineProperty(this, "animTick", {
		get: function() {
			return _animTick;
		},
		set: function(tick) {
			// early exit if setting during frozen state
			if (this._freezeStateTick) return;
			if (tick === undefined) tick = 0;
			// store the existing animtick before updating it.
			this.previousAnimTick = _animTick;
			_animTick = tick;
		}
	});
	// animation helper properties useful in user state machine code.
	// animFinalTick returns the final tick of the current anim.
	Object.defineProperty(this, "animFinalTick", {
		get: function() {
			if (!this.animInstance) return null;
			return this.animInstance.anim.tickLength - 1;
		}
	});
	// animIsFinalTick returns true if this is the final tick of the current anim, else false.
	Object.defineProperty(this, "animIsFinalTick", {
		get: function() {
			if (!this.animInstance) return null;
			return (this.animTick === this.animInstance.anim.tickLength - 1) ? true : false;
		}
	});
	// animFrameNo returns the index of the current frame of the current anim.
	Object.defineProperty(this, "animFrameNo", {
		get: function() {
			if (!this.animInstance) return null;
			return this.animInstance.getCurrentFrame(this.animTick).frameNo;
		}
	});
	// animFinalFrameNo returns the index of the final frame of the current anim.
	Object.defineProperty(this, "animFinalFrameNo", {
		get: function() {
			if (!this.animInstance) return null;
			return this.animInstance.anim.frames.length - 1;
		}
	});
	// animIsFinalFrame returns true if this is the final frame of the current anim, else false.
	Object.defineProperty(this, "animIsFinalFrame", { // todo: naming is consistent but ugly
		get: function() {
			if (!this.animInstance) return null;
			return (this.animInstance.anim.frames.length - 1 === this.animInstance.getCurrentFrame(this.animTick).frameNo) ? true : false;
		}
	});
	// animFrameTick returns the number of ticks since the current frame began.
	Object.defineProperty(this, "animFrameTick", {
		get: function() {
			if (!this.animInstance) return null;
			var f = this.animInstance.getCurrentFrame(this.animTick);
			return this.animTick - f.startTick;
		}
	});
	// animFrameFinalTick returns final tick of the current frame.
	Object.defineProperty(this, "animFrameFinalTick", {
		get: function() {
			if (!this.animInstance) return null;
			return this.animInstance.getCurrentFrame(this.animTick).tickLength - 1;
		}
	});
	// animFrameIsFinalTick returns true if this is the final tick of the current frame, else false.
	Object.defineProperty(this, "animFrameIsFinalTick", {
		get: function() {
			if (!this.animInstance) return null;
			var f = this.animInstance.getCurrentFrame(this.animTick);
			return (this.animTick === f.startTick + f.tickLength - 1) ? true : false;
		}
	});
	// animFrameNoAndTick returns a string combining the frame no and the frame
	// tick separated by a space. Useful as a shortcut that can reduce the need
	// for nested switch/if statements in the state machine.
	Object.defineProperty(this, "animFrameNoAndTick", {
		get: function() {
			if (!this.animInstance) return null;
			var f = this.animInstance.getCurrentFrame(this.animTick);
			return f.frameNo + " " + (this.animTick - f.startTick);
		}
	});
	// current audio sample being played. This is a JS audio object.
	// todo: this is currently unused. Replace when instance audio gets revamped
	this.audio = null;
	// name of the last audio played for the instance. Note that several sounds
	// can be triggered in the one tick by settings this property repeatedly, and
	// the value of the property only represents the last audio played. These is
	// currently no way to affect earlier audio samples, even if they're still playing.
	// Private prop with public setter/getter.
	var _audioName = null;
	Object.defineProperty(this, "audioName", {
		get: function() {
			return _audioName;
		},
		set: function(nameArray) {
			// audioName is unique in that it can be a string or an array of strings
			// (the latter allowing state machines to play two or more sound effects
			// in one call). If a string is passed, it will be turned into a
			// single-element array.
			var i = 0;
			// early exit if setting during frozen state
			if (this._freezeStateTick) return;
			// silent exit if audioName is null
			if (nameArray === null) {
				this._audioName = null;
				return true;
			}
			if (typeof nameArray === "string" || nameArray instanceof String) {
				this._audioName = [nameArray];
			}
			else {
				this._audioName = nameArray;
			}
			// Make sure each audio sample exists before playing it
			i = this._audioName.length;
			while (i--) {
				if (!xlib.audioStore.audioSamples[this._audioName[i]]) {
					xlib.log("Error:    invalid audioName '" + this._audioName[i] + "' provided for instance '" + this.name + "', state " + this.stateId + ". Check that audioName is correct in state machine. If you're using a actorConstant, ensure it's spelt correctly and has been set for the actor.");
				}
				else {
					// play the matching audio once.
					xlib.audioStore.audioSamples[this._audioName[i]].play();
				}
			}
		}
	});
	// the physical attributes of the actor, including position, velocity
	// and mass.
	this.physics = physicsObject;
	// hitPoints of the instance. This is usually affected by the state machine.
	this.hitPoints = this.actor.actorConstants.hitPoints;
	// if set, indicates the player in control of this instance.
	// todo: hack: this is currently duplicated in the player instance because of
	// need to access this information in runStateMachines().
	this.player = null;
	// if set, indicates that another actor instance spawned this one (typically
	// via the createActorInstance command).
	this.parentInstanceName = null;
	// temp: todo: direction for instance. This is used for sprite/box flipping.
	// the name here is bad and we should find a better way to refer to it.
	// It should really be turned into 'direction'.
	// We don't want to force this into every instance if the game doesn't
	// use it or it doesn't make sense in the game context. Also, the
	// bitwise value used (1,2,3,4) doesn't make sense outside of the context
	// of getInstanceDrawList().
	var _axisFlip;
	if ((this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_RIGHT) === xlib.INSTANCEDIRECTION_RIGHT) {
		_axisFlip = xlib.INSTANCEDIRECTION_RIGHT;
	}
	else if ((this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_LEFT) === xlib.INSTANCEDIRECTION_LEFT) {
		_axisFlip = xlib.INSTANCEDIRECTION_LEFT;
	}
	else if ((this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_UP) === xlib.INSTANCEDIRECTION_UP) {
		_axisFlip = xlib.INSTANCEDIRECTION_UP;
	}
	else if ((this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_DOWN) === xlib.INSTANCEDIRECTION_DOWN) {
		_axisFlip = xlib.INSTANCEDIRECTION_DOWN;
	}
	if (_axisFlip === undefined) {
		xlib.log("Error:   xlib.actorStore.actorInstance(): no valid directions specified in actorConstants for actor '" + this.actor.name + "'.");
	}
	Object.defineProperty(this, "axisFlip", {
		get: function() {
			return _axisFlip;
		},
		set: function(axisFlip) {
			// early exit if setting during frozen state
			if (this._freezeStateTick) return;
			// if we're passed an invalid direction, ignore the change
			if ((axisFlip & xlib.INSTANCEDIRECTION_LEFT) !== xlib.INSTANCEDIRECTION_LEFT &&
			    (axisFlip & xlib.INSTANCEDIRECTION_RIGHT) !== xlib.INSTANCEDIRECTION_RIGHT && 
			    (axisFlip & xlib.INSTANCEDIRECTION_UP) !== xlib.INSTANCEDIRECTION_UP && 
			    (axisFlip & xlib.INSTANCEDIRECTION_DOWN) !== xlib.INSTANCEDIRECTION_DOWN) {
				xlib.log("Error:    actorInstance.axisFlip setter given invalid direction. Direction not changed.");
			}
			// ignore changes not allowed by the actor
			// todo: now: if the given axisFlip is 0, then this never triggers and we
			// turn the instance. Change the INSTANCEDIRECTION constants, along with
			// directionsAllowed, to use 1 for RIGHT instead of 0. While we're making
			// this change, rename axisFlip to direction.
			else if ((this.actor.actorConstants.directionsAllowed & axisFlip) !== axisFlip) {
				xlib.log("Error:    actorInstance.axisFlip setter given direction not allowed by instance actorConstants. Direction not changed.");
			}
			else {
				_axisFlip = axisFlip;
			}
		}
	});
	// user object. This is never accessed by xlib code, but is made available to
	// state machines for remembering arbitrary values or custom functions across
	// runs of the state machine.
	this.userVars = {};
	// pending stateId and stateTick changes. These are stored on the instance to
	// take effect on the next state update. When those properties are changed
	// inside the state processor, they're automatically added here.
	this.pendingStateId = null;
	this.pendingStateTick = null;
	// incoming hit data such as damage, type, knockdown, etc. These are stored on
	// the instance to take effect on the next state update.
	this.incomingHits = [];
	// object containing information on whether previous hits were successful
	// (one of this instance's hitBoxes connected with another instance's bodyBox
	// while a hit command was active). Only hits with an id set are tracked.
	// See notes in runStateCommands() for more information.
	this.connectedHits = {};
	// commands issued from the state machine. This is a way for the state machine
	// to queue special functions that it can't run itself due to a lack of info,
	// or instructions for a later processor to run. It also serves to keep
	// internal object and function references out of the state machine logic.
	// see runStateCommands() for documentation and a list of commands.
	this.commands = [];
	// collisions with other instances that have been found this tick. Don't rely
	// on this property unless the collision detection function has updated it.
	// Format and example:
	//   [[thisInstanceCollisionBoxIndex, otherInstance, otherInstanceCollisionBoxIndex], ...]
	//   [0, InstanceObj, 2]
	this.collisionsThisTick = [];
	// actionBuffer is a two-dimensional array where the last three tick's
	// worth of actions are stored. When updating the state below the older
	// actions are considered first, moving upwards through the array.
	// This allows an action to still activate even if the player inputs it
	// a frame too early, common with "wake up"-style actions.
	// Example actionBuffer:
	//   [0] = ["punch", "jump still", ...]   // player 1, oldest actions
	//   [1] = ["left"]
	//   [2] = ["up", "dragon wing"]      // player 1, newest actions
	// todo: decide at runtime the length of the actionBuffer array based on the
	// fps of the game, or provide a function to set how long the buffer is in
	// milliseconds (again, this requires the fps to be passed in or sampled).
	this.actionBuffer = [];
	// used for pausing the incrementing of stateTick inside runStateMachines().
	this._freezeStateTick = 0;
	// create getter for control property. Control is a convenience property that
	// returns true if the instance is in a state that can be interrupted as if
	// it where state 0. This list can be modified by setting controlStates below.
	Object.defineProperty(this, "control", {
		get: function() {
			var len = this.controlStates.length;
			var i;
			for (i = 0; i < len; i++) {
				if (this.stateId === this.controlStates[i]) return true;
			}
			return false;
		}
	});
	// helper property to determine whether a character is in on the ground.
	Object.defineProperty(this, "onGround", {
		get: function() {
			return (this.physics.y + this.physics.h >= this.physics.group.bounds.y + this.physics.group.bounds.h) ? true : false;
		}
	});
	// helper property to determine whether a character is in the air. Always
	// returns the opposite to .onGround.
	Object.defineProperty(this, "inAir", {
		get: function() {
			return (this.physics.y + this.physics.h < this.physics.group.bounds.y + this.physics.group.bounds.h) ? true : false;
		}
	});
	// array containing the ids of states that can be interrupted as if the
	// instance were is state 0 (idle). Defaults to idle and walk states.
	this.controlStates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
	
	// if the statemachine has an init() method, run it. This can be used to set
	// up initial values for userVars or override starting states.
	if (this.actor.stateMachine.init) {
		this.actor.stateMachine.init(this);
	};
	
	// storage for state and named event callback
	this._eventCallbacks = {};
	
};
// todo: rename params to something more sensible
// todo: leaveState events?
xlib.actorStore.actorInstance.prototype.addListener = function(stateIdOrEventName, callback, thisContext) {
	// validation
	if (typeof callback !== "function") {
		xlib.log("Error:    actorInstance.addListener() received invalid callback.");
		return false;
	}

	// special-case event names that don't correspond to a particular state id
	if (typeof stateIdOrEventName === "string") {
		stateIdOrEventName = stateIdOrEventName.toLowerCase();
		switch (stateIdOrEventName) {
			case "hit":
				break;
			case "gethitground":
				stateIdOrEventName = STATEID_GETHITGROUND;
				break;
			case "gethitair":
				stateIdOrEventName = STATEID_GETHITAIR;
				break;
			case "gethitknockdown":
				stateIdOrEventName = STATEID_GETHITKNOCKDOWN;
				break;
			case "gethit":
				// handle all the get hit cases.
				if (!this.addListener(xlib.STATEID_GETHITGROUND, callback, thisContext)) return false;
				if (!this.addListener(xlib.STATEID_GETHITAIR, callback, thisContext)) return false;
				if (!this.addListener(xlib.STATEID_GETHITKNOCKDOWN, callback, thisContext)) return false;
				return true;
				break;
			default:
				xlib.log("Error:    actorInstance.addListener() received invalid event name '" + stateIdOrEventName + "' or ");
				return false;
		}
	}
	
	// check for duplicate callback
	if (this._eventCallbacks[stateIdOrEventName]) {
		var i = this._eventCallbacks[stateIdOrEventName].length;
		while (i--) {
			if (this._eventCallbacks[stateIdOrEventName][i] === callback) {
				xlib.log("Error:    actorInstance.addListener(): duplicate callback function already set for event name or state id '" + stateIdOrEventName + "'.");
				return false;
			}
		}
	}
	
	// create if callback array doesn't exist for this state
	if (!this._eventCallbacks[stateIdOrEventName]) {
		this._eventCallbacks[stateIdOrEventName] = [];
	}
	this._eventCallbacks[stateIdOrEventName].push([callback, thisContext]);
	
	return true;
},
xlib.actorStore.actorInstance.prototype.removeListener = function(stateIdOrEventName, callback) {
	if (!this._eventCallbacks[stateIdOrEventName]) {
		xlib.log("Error:    actorInstance.removeListener() can't find callback function to remove from event name or state id '" + stateIdOrEventName + "'.");
		return false;
	}
	var i = this._eventCallbacks[stateIdOrEventName].length;
	while (i--) {
		this._eventCallbacks[stateIdOrEventName].splice(i, 1);
	}
	return true;
},
xlib.actorStore.actorInstance.prototype.dispatchEvents = function() {
	// dispatch appropriate events based on changes to state id or state tick.
	var
		i = 0,
		j = 0,
		p,
		q,
		eventCallbacks = this._eventCallbacks;
	
	// dispatch any state-driven events. Some have special requirements for what
	// parameters are sent.
	if (this.stateId !== this.previousStateId && this.stateTick === 0) {
		if (eventCallbacks[this.stateId]) {
			i = eventCallbacks[this.stateId].length;
			while (i--) {
				switch (this.stateId) {
					case xlib.STATEID_GETHITGROUND:
					case xlib.STATEID_GETHITAIR:
					case xlib.STATEID_GETHITKNOCKDOWN:
						// pass _incomingHitsPreviousTick object to the callback function. While the
						// callback already has this information on the instance, it doesn't
						// know which element of the _incomingHitsPreviousTick array is the one that it's
						// being called for.
						j = this._incomingHitsPreviousTick.length;
						while (j--) {
							if (eventCallbacks[this.stateId][i][1]) {
								eventCallbacks[this.stateId][i][0].call(eventCallbacks[this.stateId][i][1], this._incomingHitsPreviousTick[j]);
							}
							else {
								eventCallbacks[this.stateId][i][0](this._incomingHitsPreviousTick[j]);
							}
						}
						break;
					default:
						if (eventCallbacks[this.stateId][i][1]) {
							eventCallbacks[this.stateId][i][0].call(eventCallbacks[this.stateId][i][1]);
						}
						else {
							eventCallbacks[this.stateId][i][0]();
						}
						break;
				}
			}
		}
	}
	
	// dispatch any hit events to attacker. Only fire the event on the first tick
	// of the hit, before any hitPause.
	if (eventCallbacks.hit && eventCallbacks.hit.length) {
		i = eventCallbacks.hit.length;
		// step through callbacks
		while (i--) {
			// step through hit names
			for (p in this._connectedHitsPreviousTick) {
				// step through instances hit
				j = this._connectedHitsPreviousTick[p].length;
				while (j--) {
					if (eventCallbacks["hit"][i][1]) {
						eventCallbacks["hit"][i][0].call(eventCallbacks["hit"][i][1], this._connectedHitsPreviousTick[p][j]);
					}
					else {
						eventCallbacks["hit"][i][0](this._connectedHitsPreviousTick[p][j]);
					}
				}
			}
		}
	}
	
	return true;
},

xlib.actorStore.actorInstance.prototype.isCommandActive = function(commandType) {
	// Convenience function for checking whether a particular type of command (eg.
	// hit) is currently in the actor's command queue.
	// todo: convert commands to an object with add/remove/exists methods. Then
	// switch all code that accesses commands directly to use the methods instead.
	// this includes state machines and the runStateCommands stuff below.
	var
		commands = this.commands,
		len = commands.length,
		i;
	for (i = 0; i < len; i++) {
		if (commands[i].type.toLowerCase() === commandType.toLowerCase()) {
			return true;
		}
	}
	return false;
},

xlib.actorStore.actorInstance.prototype.runStateMachines = function(actorInstance) {
	// Step through each of this instance's actions and ask the state machine
	// resolver whether the action can interrupt the current state. If so, stop
	// stepping through the actions and pass the new state information to the
	// state machine processor.

	// Possible changes from the resolver and processor include state id and
	// tick, anim name and tick, audio, physics and many others.
	// todo: pass a proxy object to the resolver/processor that only contains
	// getter/setters for the appropriate properties. For example, the object sent
	// to the resolver contains getters for all the 'public' properties by setters
	// for only stateId and stateTick. The processor gets a similar object with
	// setters for more properties.
	// The objects can be instantiated just before running the resolver/processor.
	// The constructor will be passed an instance that the properties are to apply
	// to.
	// This will fix the user state machines being able to screw around with
	// internal instance properties along with making it possible to block writing
	// to instance properties during freezeStateTick and other similar effects.
	// todo: once this is done, kill actorInstance.isFrozen() since we'll only
	// run the processor during freezeStateTick if the resolver changed stateId
	// or stateTick, both of which reset freezeStateTick. This means the user
	// state machines won't need to test whether the instance is frozen before
	// iterating values like physics.

	var actor;
	var actionBuffer;
	// insane counter names
	var i, j, k, l, m, n;
	// flag to indicate that the resolver has run at least once.
	var resolverRun;
	var xlib = window.xlib;
	var animStore = xlib.animStore;
	var audioStore = xlib.audioStore;
	var player;
	var actorConstants;
	var r;
	var stateMachines, stateMachinesLen;

	// todo: early exit if the instance is immutable. We don't have a way
	// to make an instance immutable yet apart from removing the resolver

	// get the new actor instance, actor and player objects.
	actor = this.actor;
	// early exit if the instance can't be affected by state change
	if (!actor.stateMachine.resolver) return true;
	actorConstants = this.actor.actorConstants;
	player = this.player;
	// convenience var for pending actions
	actionBuffer = this.actionBuffer;

	// build a full set of state machines for this instance. We loop through this
	// later to avoid a lot of code duplication.
	stateMachines = [this.actor.stateMachine];
	if (this.actor.stateMachine.inherit) {
		stateMachines.push.apply(stateMachines, this.actor.stateMachine.inherit);
	}
	stateMachinesLen = stateMachines.length;

	// if incomingHit has been set then store the appropriate hit action at
	// the beginning of the instance's action buffer. The action will be
	// resolved like a normal user-initiated action, allowing a state machine
	// to ignore it in special cases such as super armour.
	// The pendingHit object will be available to the state machine on the
	// instance.
	// todo: incomingGrab, incomingThrow, incomingWhatever. Find a general term
	// that can apply to grabs and throws -- bind? hold?
	if (this.incomingHits.length) {
		// ensure there's an array in the first element of the actionBuffer
		// todo: here and in plenty of other places we're directly modifying
		// actionBuffer elements. Great speed wise, but not good oop
		if (!actionBuffer[0]) actionBuffer[0] = [];
		actionBuffer[0].unshift("get hit");
	}

	// decrement the state tick freezer. Doing this before checking it lets
	// us update the state tick if required to get past the frozen state tick.
	if (this._freezeStateTick) {
		this._freezeStateTick--;
		// temp: hack: lock physics object
		this.physics.immutable = true;
	}
	else {
		// temp: hack: unlock physics object
		this.physics.immutable = false;
	}

	// process any pending state changes from the last processor run.
	// If there are pending changes to stateId or stateTick then skip
	// incrementing stateTick and animTick this frame.
	// Note: pending state changes reset freezeStateTick.
	// todo: move this into a function on the instance called processPendingStateChanges() or somesuch
	if (this.pendingStateId !== null) {

		this.previousStateId = this.stateId;
		this.stateId = this.pendingStateId;
		this.pendingStateId = null;

		this.stateTick = this.pendingStateTick;
		this.pendingStateTick = null;

		this._freezeStateTick = 0;

		// clear existing commands that don't want to be span across state
		// changes. This removes existing hits, state freezes, etc.
		var commands = this.commands;
		var i = commands.length;
		while (i--) {
			if (!commands[i].persistThroughStateChange) commands.splice(i, 1);
		}
	}
	else if (this.pendingStateTick !== null) {
		// use the stateTick value if pending.
		this.stateTick = this.pendingStateTick;
		this.pendingStateTick = null;
		this._freezeStateTick = 0;
	}
	else {
		// if freezeStateTick is larger than 0 then don't increment the
		// stateTick at all. This is used to 'pause' the instance (including
		// animation) without losing track of where the state was up to
		// (commonly used when hitting another character).
		// Note that freezing an instance only stops the stateTick and animTick
		// from being incremented. The state machine still runs during a freeze
		// and any updates to properties in that tick will be applied repeatedly
		// for each tick paused. While there's no danger in setting a property
		// to a specific value repeatedly, beware of freezing on a state tick
		// that increments an existing value (eg. dividing or multiplying
		// physics values).
		// no pending state changes. Increment stateTick if no freeze value set.
		// See note on actorInstance.stateTick() as to why we're not using it
		// to update stateTick.
		if (!this._freezeStateTick) this.advanceStateTick();
	}

	// increment animTick while an animation is running and no freeze value is
	// set. Set it back to 0 when it reaches the anim length.
	if (this.animInstance && !this._freezeStateTick) {
		this.animTick = (this.animTick + 1) % this.animInstance.anim.tickLength;
	}

	if (xlib.debug > 1 && this._freezeStateTick) xlib.log("instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + " freezeStateTick " + this._freezeStateTick);

	j = actionBuffer.length;
	for (k = 0; k < j; k++) {
		// early continue: skip this actionBuffer element if it's empty
		if (actionBuffer[k] === undefined || !actionBuffer[k].length ) continue;

		l = actionBuffer[k].length;
		// Send each of the actions off to the state machine resolver and get the result.
		// If false, leave the action on the queue and move to the next action.
		// If true, remove the action and all previous actions and immediately
		// transition to the new state.

		// individual actions in each buffer.
		for (m = 0; m < l; m++) {
			// store that we've run the state resolver at least once
			resolverRun = true;

			// send the state info away to the resolver. If there's
			// note: action names are intentionally case insensitive.
			for (n = 0; n < stateMachinesLen; n++) {
				r = stateMachines[n].resolver(actionBuffer[k][m].toLowerCase(), this, this.physics, this.userVars, actorConstants, this.commands);
				if (r !== undefined) break;
			}
			// if the result is false, the action has been matched by the resolver
			// but the state shouldn't take effect this tick. Leave the action
			// on the buffer so it gets tested again next tick. See
			// inputStore.updateActionBuffer() for exceptions to do with
			// hold-only, single-tick, non-buffered actions (the noBuffer flag).

			// if the result is true, the action should be executed and the
			// changes made by the state machine should be immediately accepted.
			if (r) {
				// remove this action and all previous actions from the buffer so
				// they can't trigger again.
				// note: using .splice for this would be ideal but gets complicated
				// because we'd need to use .apply() to pass the new blank elements.
				// Let's just use a loop instead.
				// todo: this removes other actions in from the same tick as well
				// as the one we just accepted. Are there any cases where we'd need
				// to keep those actions?
				for (n = 0; n <= k; n++) actionBuffer[n] = undefined;
				break;
			}
		}
		// grr, annoying that break doesn't accept a number like PHP
		if (r) break;
	}

	// it's possible to get here without running the resolver if there were
	// no actions in queue. It must be run at least once or else an instance
	// can get stuck in a state and never return to idle.
	if (!resolverRun) {
		// todo: any point in getting the return value?
		for (n = 0; n < stateMachinesLen; n++) {
			r = stateMachines[n].resolver("", this, this.physics, this.userVars, actorConstants, this.commands);
			if (r !== undefined) break;
		}
	}

	// don't run the processor if we're frozen. If the resolver just changed state
	// then freezeStateTick will have been cleared.
	if (!this._freezeStateTick) {
		// tell the instance that any changes to stateId or stateTick from here
		// on are to be stored as "pending". The changes will be applied just
		// before the resolver runs again.
		this.makeStateChangesPending = true;

		// run the processor
		// todo: return value from the processor isn't used atm
		for (n = 0; n < stateMachinesLen; n++) {
			r = stateMachines[n].processor(this, this.physics, this.userVars, actorConstants, this.commands);
			if (r !== undefined) break;
		}

		// reset the pending flag.
		this.makeStateChangesPending = false;

		// clear the hit status object.
		this._connectedHitsPreviousTick = this.connectedHits;
		this.connectedHits = {};

		// clear the pending hit object now that the state machine has seen it.
		this._incomingHitsPreviousTick = this.incomingHits;
		this.incomingHits = [];
	}

	return true;
};

xlib.actorStore.actorInstance.prototype.runStateCommands = function() {
	// Commands is an array of instructions set by the user state machine.
	// A command is set by pushing a command object onto the commands array.
	// The only standard property for a command object is 'type'. This must be
	// set to one of the recognised command types (eg. "hit", "hitspark", etc).
	// See the documentation for each command type below for their appropriate
	// parameters.

	// Property values are case-sensitive with the exception of 'type'.

	// note: commands was originally an object with each command as a property,
	// but this stopped state machines from creating overlapping hit commands.

	// we default to running the state machines of all the instances, but if
	// a single instance was passed then use that instead.
	var commands, command, collisions;
	// counters
	var i, j, k;
	// temporary storage for _freezeStateTick
	var freezeTicks;

	commands = this.commands;
	collisions = this.collisionsThisTick;
	freezeTicks = this._freezeStateTick || 0;

	// todo: are there any commands that we'd want to run during freezeStateTick?
	// if not, return immediately and remove the clunky checks below (be careful
	// of the hit case below that has conditions upon the command removal).

	j = commands.length;
	while (j--) {
		command = commands[j];

		// early continue on empty type
		if (!command.type) {
			xlib.log("Warning:  actorStore.runStateCommands() found invalid command type for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the invalid command type.");
		}

		// switch on the command name. The blank string concat is a workaround
		// for when type is a number.
		switch ((command.type + "").toLowerCase()) {

			case "swapbindings":
				// Switches one binding's value for another. Useful for switching
				// the key binding of "forward" and "backward" in a 2d game.
				//   commands.push({
				//     type: "swapBindings",
				//     bind1: "F", // string
				//     bind2: "B"  // string
				//   });
				if (command.bind1 === undefined || command.bind2 === undefined) {
					xlib.log("Warning:  actorStore.runStateCommands() found invalid parameters (expected two) for command 'swapBindings' for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the invalid swapBindings command.");
				}
				else {
					// Note: some commands are not run while a state is frozen. This
					// prevents side effects like repeated hits and bind switches as
					// well as infinite loops from repeatedly activating freezeStateTick.
					// also redundant unless there's a player.
					if (!this._freezeStateTick && this.player) this.player.swapBindings(command.bind1, command.bind2);
				}
				// remove the command. Safe since we're stepping backwards through the array.
				commands.splice(j, 1);
				break;

			case "faceActorInstance":
				// Turns the actorInstance to face in the direction of another instance.
				//   commands.push({
				//     type: "faceActorInstance",
				//     instance: objref      // object reference to actor instance
				//   });
				
				// todo: add vertical/rotational facing (essentially "look at").
				if (this.x < command.instance.x) {
					this.axisFlip = 0;
				}
				else {
					this.axisFlip = 1;
				}
				
				// removed the command.
				commands.splice(j, 1);
				break;

			case "nothitby":
				// Creates a property on this instance that the 'hit' command code
				// will look for to determine whether the hit is to be totally ignored.
				//   commands.push({
				//     type: "notHitBy",
				//     hitTypes: [0, 2, 19], // array of hitTypes
				//     ticks: 5              // opt uint 1
				//     persistThroughStateChange: false  // opt bool false
				//   });
				// todo: add descriptions
				// 'persistThroughStateChange' allows the effect to remain on even if
				// the instance moves into another state.
				// hack: basic impl for now -- hit type is ignored and instance is
				// invulnerable to everything.
				// todo: seen todo text file for notes on implementing this
				// Makes an instance un-hittable by particular types of hit.
				if (command.persistThroughStateChange === undefined) command.persistThroughStateChange = false;
				
				if (!this._freezeStateTick) {
					command.ticks--;
					if (!command.ticks || command.ticks < 1) commands.splice(j, 1);
				}
				break;

			case "hit":
				// Tells the state machine to apply hitPending to instances whose
				// bodyboxes are in collision with this instance's hitBoxes this frame.
				//   commands.push({
				//     type: "hit",
				//     hitType: "jab",      // opt string 0
				//     modifier: "low"      // opt string 0
				//     ticks: 5,            // opt uint 1
				//     damage: 35,          // opt float 0
				//     knockdown: 0,        // opt uint 0
				//     hitsparkId: 0,       // opt uint null
				//     applyHitpause: true, // opt bool true
				//     audioGetHit: "hit2", // opt string null
				//     name: "jab1"         // opt string null
				//   });
				// 'hitType' is passed to the state machine and used in determining
				// which animation and sound to use.
				// While any number or string can be used as a hitType, the state
				// machine resolver and processor of the instance receiving the hit must
				// recognise those values in order to do anything useful with them.
				// The hitType values below are used by the generic character state
				// machine and serve as an example of what can be used for hitTypes.
				//   light     (light hit, usually unarmed)
				//   strong    (strong hit, usually unarmed)
				//   fierce    (fierce hit, usually unarmed)
				//   knockdown (knockdown hit, usually unarmed)
				//   blunt     (blunt weapon such as bats or chairs)
				//   slash     (slashing weapon such as long blades or swords)
				//   stab      (stabbing weapon such as knives)
				// 'modifier' is passed to the state machine and used in determining
				// which animation and sound to use. Depending on the type of game,
				// the modifier may be irrelevant. State machines must be programmed to
				// recognise and use the modifier value.
				// The modifier values below are used by the generic character state
				// machine and serve as an example of what can be used for the modifier.
				//   high (causes the 'getHitHigh' animation to be used)
				//   low  (causes the 'getHitLow' animation to be used)
				// 'ticks' is the number of ticks that the hit is valid for. This
				// allows a single hit command to last over a period of time but
				// only activate once per instance.
				// 'damage' is the number of hitPoints to remove from the receiving
				// instance. If negative, health will be added.
				// 'knockdown' determines whether the incoming hit knocks the receiving
				// instance over. Depending on the game this property may be irrelevant.
				// The knockdown values below are used by the generic character state
				// machine and serve as an example of what can be used for knockdown.
				//   0 (no knockdown even when the hit causes a knock out) // todo: crumple?
				//   1 (no knockdown)
				//   2 (always knockdown)
				// 'name' is optional and provides a way to track this hit's status.
				// If the hit connects, a property will be created on
				// instance.connectedHits using the name as the property name with the
				// value set to true. Note that the connectedHits object is cleared
				// automatically after runStateMachines() executes; this means the
				// property is available to check for one tick only. Use the
				// instance's userVars object to remember the status for further ticks.
				// todo: allow hit command to state which hitbox(es) it's for.

				// if the hit is new
				if (!command.accepted) {
					if (command.hitType === undefined) command.hitType = 0;
					if (command.modifier === undefined) command.modifier = 0;
					if (command.ticks === undefined) command.ticks = 1;
					if (command.damage === undefined) command.damage = 0;
					if (command.knockdown === undefined) command.knockdown = 0;
					if (command.hitsparkId === undefined) command.hitsparkId = null;
					if (command.applyHitpause === undefined) command.applyHitpause = true;
					if (command.audioGetHit === undefined) command.audioGetHit = null;
					if (command.name === undefined) command.name = null;
					// early exit if someone set a hit command with ticks of 0.
					// remove this command and move on.
					if (!command.ticks || command.ticks < 1) {
						xlib.log("Warning:  actorStore.runStateCommands() found invalid hit command with ticks set to 0 for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the hit command.");
						commands.splice(j, 1);
						break;
					}
				}

				if (!this._freezeStateTick) {
					// remember that we accepted this hit command while
					// freezestatetick wasn't active. Hit commands that get to the
					// bottom of this case without the accepted flag are immediately
					// removed. This stops the same hit from queueing multiple times
					// and all activating at once when freezestatetick runs out.
					command.accepted = true;
					// decrement this hit's lifetime
					command.ticks--;
					// todo: make the parameters do something (damage etc)
					// todo: can't specify different damage/effects for individual hitboxes
					// or bodyboxes.
					k = collisions.length;
					if (k) {
						// step through each instance in the collision array. If it doesn't
						// have a good reason for not entering a hit state, set pendingHit.
						var
							incomingHit,
							len,
							hitInstance,
							hitInstanceCommands,
							hitInstanceCommandIndex,
							newConnectedHits;

						collision_loop:
						while (k--) {
							// skip collision if recieving instance has a notHitBy command.
							incomingHit = {};
							hitInstance = collisions[k][1];
							hitInstanceCommands = hitInstance.commands;
							len = hitInstanceCommands.length;
							// urgh
							for (hitInstanceCommandIndex = 0; hitInstanceCommandIndex < len; hitInstanceCommandIndex++) {
								if ((hitInstanceCommands[hitInstanceCommandIndex].type + "").toLowerCase() === "nothitby") {
									continue collision_loop;
								}
							}
	
							// if the instance is on the blacklist then it's already received
							// the hit and shouldn't again.
							// todo: ugly solution; comparing instance names means every
							// instance needs a unique name. Better to store an object ref
							// in an array, but then the line below becomes a loop instead
							// of a simpler lookup.
							if (command._hitBlacklist && command._hitBlacklist[hitInstance.name]) {
								continue;
							}
	
							// Store a new pending hit on the receiving instance so it can
							// apply it during the next state machine update.
							incomingHit.hitType = command.hitType;
							incomingHit.modifier = command.modifier;
							incomingHit.damage = command.damage;
							incomingHit.knockdown = command.knockdown;
							incomingHit.audioGetHit = command.audioGetHit;
							incomingHit.attackingInstance = this;
							incomingHit.receivingInstance = hitInstance;
							if (((hitInstance.physics.x + hitInstance.physics.w) / 2) <= ((this.physics.x + this.physics.w) / 2)) {
								// hit instance is left of the attacker
								incomingHit.direction = xlib.INSTANCEDIRECTION_LEFT;
							}
							else {
								incomingHit.direction = xlib.INSTANCEDIRECTION_RIGHT;
							}
							
							// add hit properties to the hit instance
							hitInstance.incomingHits.push(incomingHit);
							hitInstance.lastIncomingHit = incomingHit;
							
							// if there's a name then the hitting instance wants to track the
							// hit. Add it to the connectedHits object on the originating instance.
							if (command.name !== undefined) {
								// new command name if necessary
								if (!this.connectedHits[command.name]) {
									this.connectedHits[command.name] = [];
								}
								// add to attacker instance. Note that we clone the incomingHit
								// so that changes made by state machines are isolated.
								newConnectedHits = {
									hitType: incomingHit.hitType,
									modifier: incomingHit.modifier,
									damage: incomingHit.damage,
									knockdown: incomingHit.knockdown,
									audioGetHit: incomingHit.audioGetHit,
									attackingInstance: incomingHit.attackingInstance,
									receivingInstance: incomingHit.receivingInstance,
									direction: incomingHit.direction
								};
								this.connectedHits[command.name].push(newConnectedHits);
								this.lastConnectedHit = newConnectedHits;
							}
	
							// create a hitspark if required and we have the overlap coords.
							if (command.hitsparkId !== null && collisions[k][3]) {
								// insert a new command that'll be run after the user's commands.
								// todo: the positioning needs more work.
								commands.unshift({
									type: "hitspark",
									hitsparkId: command.hitsparkId,
									// farthest overlap coord from the hitting instance, both sides
									//x: (instance.axisFlip & 1) ? collisions[k][3].x : collisions[k][3].x + collisions[k][3].w,
									//y: (instance.axisFlip & 2) ? collisions[k][3].y + collisions[k][3].h : collisions[k][3].y,
									// middle of the overlap box
									x: collisions[k][3].x + Math.floor(collisions[k][3].w / 2),
									y: collisions[k][3].y + Math.floor(collisions[k][3].h / 2),
									z: hitInstance.physics.z - 0.5,
									relativeToCanvas: true
								});
								// increment j so the loop doesn't skip an array element.
								j++;
							}
	
							// create the hitpause via freezeStateTick if required, but only if
							// hitPause has been set in the actor's constants.
							if (command.applyHitpause && this.actor.actorConstants.hitPause) {
								commands.unshift({
									type: "freezeStateTick",
									ticks: this.actor.actorConstants.hitPause,
									overwriteExisting: true
								});
								// increment j so the loop doesn't skip an array element.
								j++;
							}
	
							// xhva: note: todo: re-running the processor has been disabled
							// since other game state machines seem to process collisions
							// on the next frame (SOR II, SF Alpha 2).
							// run the state processor on this instance again so it has a chance
							// to apply the correct properties.
							//this.runStateMachines(hitInstance, "hit");
							// todo: test that we can override hit state 20 and ignore the
							// stateId change. Useful to emulate super-armor and similar effects.
							// todo: need to work out how to do throws and grabs triggered by
							// walking into another instance. Can we have another command to do
							// it, eg. .walkgrab or .hold?
							// todo: pass the bodyBox id to the receiving instance.
							// add the receiving instance to the hit command's blacklist.
							if (!command._hitBlacklist) command._hitBlacklist = {};
							command._hitBlacklist[hitInstance.name] = true;
						}
					}
				}
				// remove this hit command if it was not accepted due to state
				// freeze, or if it has no ticks left.
				if (!command.accepted || command.ticks === 0) commands.splice(j, 1);
				break;

			case "freezestatetick":
				// commands.push({
				//   type: "freezeStateTick",
				//   ticks: 5            // uint > 0
				//   overwriteExisting   // opt bool false
				// });
				// Tells the state machine not to increment stateTick and animTick
				// for the provided number of game ticks. Useful to create
				// "hit pause" and "super pause" effects for one actor instance
				// without affecting others.
				// addToExisting will cause the ticks from this command to be added
				// to any existing state freeze instead of ignored (the default
				// behaviour). Don't set this to true where the same freezeStateTick
				// command will be reapplied as it will lead to the state being
				// stuck forever. This argument is useful for applying one-off hit
				// pauses to other instances that may already be frozen from another
				// hit or effect.
				if (!command.ticks || command.ticks < 1) {
					xlib.log("Warning:  actorStore.runStateCommands() found invalid freezeStateTick command with ticks set to 0 for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the freezeStateTick command.");
					commands.splice(j, 1);
					break;
				}
				// note: ideally we'd remove the _freezeStateTick property from the
				// instance but it's difficult in this loop to know if there's
				// another freezestatetick already in progress.
				if (!this._freezeStateTick || command.overwriteExisting) {
					// note: we're bumping the provided value by 1 because
					// runStateMachines decrements the value before checking it.
					// note: we store the value in a temp var and apply it after all
					// the other commands have been processed. This stops other
					// commands specified during the same tick from being skipped
					// because instance._freezeStateTicks is non-zero.
					freezeTicks = command.ticks + 1;
				}
				// remove this command
				commands.splice(j, 1);
				break;

			case "hitspark":
				// commands.push({
				//   type: "hitspark",
				//   hitsparkId: 0,           // uint
				//   x: 45,                   // opt float
				//   y: 33,                   // opt float
				//   z: 0,                    // opt float
				//   relativeToCanvas: false  // opt bool false
				// });
				// Creates a hitspark on the screen using the requested hitspark
				// from the current instance's hitspark animations.
				// 'id' determines which particular hitspark is chosen from the
				// instance's set. It corresponds directly to the animsHitsparks
				// array set in the actor's constants object. For example, passing 1
				// as the type would use animsHitsparks[1]. If an invalid id is
				// passed then an error is logged and the command ignored.
				// 'x', 'y' and 'z' are the coordinates where the hitspark will be
				// created, relative to the instance except when 'relativeToCanvas'
				// is set to true.
				// 'relativeToCanvas' when true causes x and y to be treated as
				// offsets from the top left of the canvas instead of the caller instance.
				if (!this._freezeStateTick) {
					var
						x, y, z,
						particle;

					// todo: store the particle in the instance's particle group
					var anim = xlib.animStore.anims[this.actor.actorConstants.animsHitsparks[command.hitsparkId]];
					if (anim === undefined) {
						xlib.log("Warning:  actorStore.runStateCommands(): invalid hitspark id '" + command.hitsparkId + "' set in actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the hitspark command.");
						commands.splice(j, 1);
						break;
					}
					
					// convenience
					x = command.x || 0;
					y = command.y || 0;
					z = command.z || 0;
					
					if (command.relativeToCanvas) {
						// todo: hack: this is not reliable. The z adjustment could do weird
						// things to games that apply quasi-3d effects by adjusting y
						// based on z (eg. SOR).
						// todo: we really want a "always on top" or "draw last" keyword
						z = -1 + z;
					}
					else {
						// todo: hack: temp: temp hack to fix hitspark pos when turned around
						// should this become an optional behaviour to make hitsparks easier?
						x = (this.axisFlip === 0) ? Math.floor(this.physics.x) + x : Math.floor(this.physics.x) + this.physics.w - x;
						y = Math.floor(this.physics.y) + y;
						z = this.physics.z + z;
					}
					
					particle = new xlib.physicsStore.physicsParticle(
						// x, y, z
						x, y, z,
						// w, h, d
						10, 10, 1, // todo: hack: this will be a problem if we start cropping/scaling to particle dimensions
						// vx, vy, vz
						0, 0, 0,
						// mass, dragco, restitution, immutable, useAxes
						0, 0, 0, 0, 0,
						// colour, opacity, animInstance, tickLifeTime
						"transparent", 1, anim.createAnimInstance(), anim.tickLength,
						// afterUpdate, beforeDestroy
						null, null
					);

					if (Object.isEmpty(particle)) {
						xlib.log("Warning:  actorStore.runStateCommands(): can't create hitspark '" + command.hitsparkId + "' for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the hitspark command.");
						commands.splice(j, 1);
						break;
					}
		      // add the particle to the instance's physicsGroup
		      this.physics.group.addObject(particle);
					if (xlib.debug > 1) xlib.log("hitspark created, anim '" + anim.name + "', gametick " + xlib.gameTick);
				}
				// remove this command
				commands.splice(j, 1);
				break;

			case "particle":
				// commands.push({
				//   type: "particle",
				//   animName: "blah",        // string
				//   x: 45,                   // opt float
				//   y: 33,                   // opt float
				//   z: 0,                    // opt float
				//   relativeToCanvas: false, // opt bool false
				//   vx: 0,                   // opt float
				//   vy: 0,                   // opt float
				//   vz: 0,                   // opt float
				//   respectGravity: true,    // opt bool, todo: NYI
				//   ticks: 25                // opt uint
				// });
				// Creates a particle on the screen using the requested animation.
				// 'animName' determines which particular animation is used. If an
				// invalid name is passed then an error is logged and the command ignored.
				// 'x', 'y' and 'z' are the coordinates where the particle will be
				// created, relative to the instance except when 'relativeToCanvas'
				// is set to true.
				// 'relativeToCanvas' when true causes x and y to be treated as
				// offsets from the top left of the canvas instead of the caller instance.
				// 'vx', 'vy', and 'vz' are the particle's initial velocities.
				// 'respectGravity' allows the particle to be affected by the gravity of
				// the instance's physicsGroup. // todo: allow adding the particle to
				// a specific physicsGroup by name? If we add this, add to hitspark too.
				// 'ticks' specifies how long the particle will exist for, measured in
				// game ticks.
				if (!this._freezeStateTick) {
					var
						x, y, z,
						vx, vy, vz,
						particle;
					
					// todo: store the particle in the instance's particle group
					var anim = xlib.animStore.anims[command.animName];
					if (anim === undefined) {
						xlib.log("Warning:  actorStore.runStateCommands(): invalid particle animName '" + command.animName + "' set in actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the particle command.");
						commands.splice(j, 1);
						break;
					}

					// convenience
					x = command.x || 0;
					y = command.y || 0;
					z = command.z || 0;
					vx = command.vx || 0;
					vy = command.vy || 0;
					vz = command.vz || 0;
					
					if (command.relativeToCanvas) {
						// todo: hack: this is not reliable. The z adjustment could do weird
						// things to games that apply quasi-3d effects by adjusting y
						// based on z (eg. SOR).
						// todo: we really want a "always on top" or "draw last" keyword
						z = -1 + z;
					}
					else {
						// todo: hack: temp: temp hack to fix particle pos when turned around
						// should this become an optional behaviour to make hitsparks easier?
						x = (this.axisFlip === 0) ? Math.floor(this.physics.x) + x : Math.floor(this.physics.x) + this.physics.w - x;
						y = Math.floor(this.physics.y) + y;
						z = this.physics.z + z;
					}
					
					particle = new xlib.physicsStore.physicsParticle(
						// x, y, z
						x, y, z,
						// w, h, d
						10, 10, 1, // todo: hack: this will be a problem if we start cropping/scaling to particle dimensions
						// vx, vy, vz
						vx, vy, vz,
						// mass, dragco, restitution, immutable, useAxes
						1, 0, .25, 0, 7,
						// colour, opacity, animInstance, tickLifeTime
						"transparent", 1, anim.createAnimInstance(), (command.ticks || anim.tickLength),
						// afterUpdate, beforeDestroy
						null, null
					);

					if (Object.isEmpty(particle)) {
						xlib.log("Warning:  actorStore.runStateCommands(): can't create particle '" + command.animName + "' for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the particle command.");
						commands.splice(j, 1);
						break;
					}
		      // add the particle to the instance's physicsGroup
		      this.physics.group.addObject(particle);
					if (xlib.debug > 1) xlib.log("particle created, anim '" + anim.name + "', gametick " + xlib.gameTick);
				}
				// remove this command
				commands.splice(j, 1);
				break;

			case "particleexplosion":
				// commands.push({
				//   type: "particleexplosion",
				//   animNames: ["blah",...],  // array of strings
				//   x: 45,                    // opt float
				//   y: 33,                    // opt float
				//   z: 0,                     // opt float
				//   relativeToCanvas: false,  // opt bool false
				//   vx: [0,0],                // opt array of float, todo: range
				//   vy: [0,0],                // opt array of float
				//   vz: [0,0],                // opt array of float
				//   respectGravity: true,     // opt bool, todo: NYI
				//   ticks: 25,                // opt uint, todo: range
				//   distance: 0,              // opt float
				//   count: 1,                 // opt uint
				//   randomAnim: false,        // opt bool
				//   distributeRandomly: false // opt bool
				// });
				// Creates a series of particles centred around a common point using
				// animations from the animNames array.
				// 'animName' is an array of animation name strings that determine which
				// animations are used for the explosion. If an invalid name is passed
				// then an error is logged and the command ignored.
				// 'x', 'y' and 'z' are the coordinates around which the particles will
				// be centred. These positions are relative to the instance except when
				// 'relativeToCanvas' is set to true.
				// 'relativeToCanvas' when true causes x and y to be treated as
				// offsets from the top left of the canvas instead of the caller instance.
				// 'vx', 'vy', and 'vz' are the particle's min and max initial
				// velocities. A velocity will be generated between these values.
				// 'respectGravity' allows the particles to be affected by the gravity
				// of the instance's physicsGroup. // todo: allow adding the particle to
				// a specific physicsGroup by name? If we add this, add to hitspark too.
				// 'ticks' specifies how long the particle will exist for, measured in
				// game ticks.
				// 'distance' specifies how far away from the centre each particle
				// should be placed initially.
				// 'randomAnim' tells the explosion code to randomly pick an animation
				// for each particle, instead of cycling through the available list.
				// 'distributeRandomly' tells the explosion code to randomly pick a
				// point around the centre point for each particle instead of evenly
				// spacing the particles out.
				// todo: space 
				if (!this._freezeStateTick) {
					
					var
						x, y, z,
						px, py, pz,
						vx, vy, vz,
						k = command.count,
						anim, animLen = command.animNames.length, animIndex = -1,
						angle,
						rSin, rCos,
						angleIncrement;
					
					// convenience
					x = command.x || 0;
					y = command.y || 0;
					z = command.z || 0;
					vx = command.vx || 0;
					vy = command.vy || 0;
					vz = command.vz || 0;
					
					if (command.distributeRandomly) {
						angle = Math.random() * 360;
					}
					else {
						angle = 0;
					}
					
					if (command.relativeToCanvas) {
						// todo: hack: this is not reliable. The z adjustment could do weird
						// things to games that apply quasi-3d effects by adjusting y
						// based on z (eg. SOR).
						// todo: we really want a "always on top" or "draw last" keyword
						z = -1 + z;
					}
					else {
						// todo: see notes in 'particle' command above.
						x = (this.axisFlip === 0) ? Math.floor(this.physics.x) + x : Math.floor(this.physics.x) + this.physics.w - x;
						y = Math.floor(this.physics.y) + y;
						z = this.physics.z + z;
					}
					
					while (k--) {

						// anim ref
						if (command.randomAnim) {
							animIndex = Math.floor(Math.random() * animLen);
						}
						else {
							animIndex++;
							if (animIndex === animLen) animIndex = 0;
						}
						anim = xlib.animStore.anims[command.animNames[animIndex]];
						if (anim === undefined) {
							xlib.log("Warning:  actorStore.runStateCommands(): invalid particle animName '" + command.animNames[animIndex] + "' set in actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the particleExplosion command.");
							commands.splice(j, 1);
							break;
						}
					
						// ratios
						rSin = Math.sin(angle * (Math.PI / 180));
						rCos = Math.cos(angle * (Math.PI / 180));

						// pos
						px = x + command.distance * rSin;
						py = y + command.distance * rCos;
						pz = z;
						// todo: add ability to create around sphere instead of circle
						
						// vel
						vx = ((Math.random() * (command.vx[1] - command.vx[0])) + command.vx[0]) * rSin;
						vy = ((Math.random() * (command.vy[1] - command.vy[0])) + command.vy[0]) * rCos;
						vz = 0;
						
						// spawn particle
						particle = new xlib.physicsStore.physicsParticle(
							// x, y, z
							px, py, pz,
							// w, h, d
							10, 10, 1, // todo: hack: this will be a problem if we start cropping/scaling to particle dimensions
							// vx, vy, vz
							vx, vy, vz,
							// mass, dragco, restitution, immutable, useAxes
							0, 0, 0, 0, 7,
							// colour, opacity, animInstance, tickLifeTime
							"transparent", 1, anim.createAnimInstance(), (command.ticks || anim.tickLength),
							// afterUpdate, beforeDestroy
							null, null
						);
						
						if (Object.isEmpty(particle)) {
							xlib.log("Warning:  actorStore.runStateCommands(): can't create particle '" + command.animName + "' for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the particle command.");
							commands.splice(j, 1);
							break;
						}
			      // add the particle to the instance's physicsGroup
			      this.physics.group.addObject(particle);
						if (xlib.debug > 1) xlib.log("particle created, anim '" + anim.name + "', gametick " + xlib.gameTick);
						
						if (command.distributeRandomly) {
							angle = Math.random() * 360;							
						}
						else {
							
							angle = angle + (360 / command.count);
						}
					}
				}
				// remove this command
				commands.splice(j, 1);
				break;

			case "createactorinstance":
				// commands.push({
				//   type: "createactorinstance",
				//   actorName: "blah",       // string
				//   instanceName: "blah",    // opt string
				//   physicsGroup: "blah",    // string
				//   x: 45,                   // opt float, or string "center"
				//   y: 33,                   // opt float, or string "center"
				//   z: 0,                    // opt float, or string "center"
				//   axisFlip: 0,             // opt int (0, 1, 2 or 3)
				//   relativeToCanvas: false, // opt bool false
				// });
				// Creates a new actor instance with the requested name and position.
				// 'actorName' specifies an existing actor to use.
				// 'instanceName' allows you to access this instance by name afterward.
				// If not provided, a name is generated from the calling instance's name.
				// 'physicsGroup' specifies a physics group to be used for the instance.
				// The instance will be subject to the physics rules (gravity, boundaries
				// etc) that apply to that group.
				// hack: todo: the physics group stuff can die later when we've rebuilt
				// physics to be stored on the instance.
				// 'x', 'y' and 'z' are the coordinates where the instance will be
				// created, relative to the calling instance except if 'relativeToCanvas'
				// is set to true.
				//   - If x, y, or z is set to "center", the new instance will be
				//     centered within its creator on that axis.
				//   - If x is set to "left" then the new instance will be aligned to
				//     the left edge within its creator.
				//   - If x is set to "right" then the new instance will be aligned to
				//     the right edge within its creator.
				//   - If y is set to "top" then the new instance will be aligned to
				//     the top edge within its creator.
				//   - If y is set to "bottom" then the new instance will be aligned to
				//     the bottom edge within its creator.
				//   - If z is set to "front" then the new instance will be aligned to
				//     the inner front edge of its creator.
				//   - If z is set to "back" then the new instance will be aligned to
				//     the inner back edge of its creator.
				// (todo: do keywords for relativeToCanvas too)
				// 'axisFlip' sets the direction in which the instance is facing.
				// todo: remove axisFlip here when we change the instance to have a
				// direction instead
				// 'relativeToCanvas' causes the position variables to be relative to
				// the top left of the canvas instead of the calling instance.
				
				// todo: add the ability to modify the properties of an instance after
				// creation. Only instances created by the caller can be modified. We'll
				// need a parentInstance/ownerInstance property for this.
				// todo: same for removing a created instance
				
				if (!this._freezeStateTick) {
					
					var actor = xlib.actorStore.actors[command.actorName];
					// validate actor
					if (!command.actorName) {
						xlib.log("Warning:  actorStore.runStateCommands(): invalid actorName set in actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Actor '" + command.actorName + "' does not exist. Check the state machine for actor '" + this.actor.name + "' and correct the createActorInstance command.");
						commands.splice(j, 1);
						break;
					}

					var physicsGroup = xlib.physicsStore.groups[command.physicsGroup];
					if (!command.physicsGroup) {
						xlib.log("Warning:  actorStore.runStateCommands(): invalid physicsGroup set in actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". PhysicsGroup '" + command.physicsGroup + "' does not exist. Check the state machine for actor '" + this.actor.name + "' and correct the createActorInstance command.");
						commands.splice(j, 1);
						break;
					}

					// ensure we have an instanceName. If necessary generate one from the
					// new instance's actor name.
					var instanceName = command.instanceName;
					// generate random number as extension for name if not set.
					while (!instanceName || xlib.actorStore.instances[instanceName]) {
						instanceName = actor.name + Math.random().toString().substring(2, 5);
					}

					var x, y, z, physicsObject, instance;
					
					// convenience
					x = command.x || 0;
					y = command.y || 0;
					z = command.z || 0;
					
					// todo: allow positioning x and y to canvas
					if (command.relativeToCanvas) {
						z = -1 + z; // todo: we really want a "always on top" keyword
					}
					else {
						// position keywords
						switch (x.toString().toLowerCase()) {
							case "left":
								x = this.physics.x;
								break;
							case "right":
								x = this.physics.x + this.physics.w - actor.actorConstants.width;
								break;
							case "center":
								x = this.physics.x + (this.actorConstants.width - actor.actorConstants.width);
								break;
							default:
								// todo: hack: temp: temp hack to fix hitspark pos when turned
								// around. Make this behaviour a keyword instead.
								x = (this.axisFlip === 0) ? Math.floor(this.physics.x) + x : Math.floor(this.physics.x) + this.physics.w - x;
								//x = Math.floor(this.physics.x) + x;
						}
						
						switch (y.toString().toLowerCase()) {
							case "top":
								y = this.physics.y;
								break;
							case "bottom":
								y = this.physics.y + this.physics.h - actor.actorConstants.height;
								break;
							case "center":
								y = this.physics.y + (this.actorConstants.height - actor.actorConstants.height);
								break;
							default:
								y = Math.floor(this.physics.y) + y;							
						}
						
						switch (z.toString().toLowerCase()) {
							case "front":
								z = this.physics.z;
								break;
							case "back":
								z = this.physics.z + this.physics.d - actor.actorConstants.depth;
								break;
							case "center":
								z = this.physics.z + (this.actorConstants.depth - actor.actorConstants.depth);
								break;
							default:
								z = this.physics.z + z;
						}
					}
					
					// create and store physics
					physicsObject = new xlib.physicsStore.physicsObject(
						x, y, z,   // x, y, z
						actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
						0, 0, 0,      // vx, vy, vz
						0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
						7             // useAxes is a bitwise value
					);
					physicsGroup.addObject(physicsObject);

					// create the instance
					instance = actor.createInstance(instanceName, physicsObject);
					if (Object.isEmpty(instance)) {
						xlib.log("Warning:  actorStore.runStateCommands(): couldn't create new actor instance in actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the createActorInstance command.");
						commands.splice(j, 1);
						break;
					}

					instance.axisFlip = command.axisFlip || 0;
					
					// set the parent. Note that we store its name here, not a reference
					// to the instance object. It's a toss-up between potentially storing
					// useless data for a long time if the parent is destroyed or
					// potentially referring to a removed instance object and inhibiting
					// garbage collection should the parent be destroyed or replaced.
					instance.parentInstanceName = this.name;
					
					// remove this command
					commands.splice(j, 1);
				}
				break;

			case "visualeffect":
				// commands.push({
				//   type: "visualeffect",
				//   effectType: "fade",               // string
				//   ticks: 30,                        // uint
				//   interval: 2                       // opt uint 1
				//   persistThroughStateChange: false  // opt bool false
				//   distances: [1,0,0]                // opt array[3 uints] [1,0,0] (used only for shake effects)
				// });
				// Applies a visual effect to the instance for a set number of ticks.
				// 'effectType' determines which effect is used. If an invalid type is
				// passed then an error is logged and the command ignored. Valid types:
				//   "fadein"       raises opacity from current value to 1
				//   "fadeout"      lowers opacity from current value to 0
				//   "blink"        toggles opacity between 0 and 1 at a set interval
				//   "shake"        shakes the instance by modifying its draw offset
				// 'ticks' sets the number of game ticks to apply the effect for. Note
				// that the effect will not update during freezeStateTick.
				// 'interval' is how often the effect is updated, measured in ticks. For
				// example, if 2 is provided, then the effect is updated every two ticks.
				// An interval of 1 means the effect is updated every tick; an interval
				// of 5 means the effect is updated every fifth tick.
				// 'persistThroughStateChange' allows the effect to remain on even if
				// the instance moves into another state.
				// 'distances' specifies the amount of shake or movement used for the
				// visual effect. Only applicable to effects that affect movement.
				if (!command.effectType || command.ticks <= 0) continue;
				if (command.interval === undefined) command.interval = 1;
				if (command.persistThroughStateChange === undefined) command.persistThroughStateChange = false;

				if (!this._freezeStateTick) {
					if (!(command.ticks % command.interval)) {
						switch (command.effectType) {
							case "fadein":
								this.opacity += ((1 - this.opacity) / command.ticks);
								break;
							case "fadeout":
								this.opacity -= (this.opacity / command.ticks);
								break;
							case "blink":
								// todo: allow blinking between any value and 0. The code below
								// only does 0 and 1 right now, but we need the change in the todo
								// comment above before we can really do this.
								this.opacity = (this.opacity === 1) ? 0 : 1;
								break;
							case "shake":
								if (command.distances === undefined) command.distances = [1,0,0];
								this.drawOffset.x = (this.drawOffset.x === command.distances[0]) ? 0 : command.distances[0];
								this.drawOffset.y = (this.drawOffset.y === command.distances[1]) ? 0 : command.distances[1];
								this.drawOffset.z = (this.drawOffset.z === command.distances[1]) ? 0 : command.distances[1];
								break;
						}
					}
				}
				// decrement the tick lifetime of the effect.
				command.ticks--;
				// remove the command if there's no ticks left.
				if (command.ticks <= 0) {
					// reset any effects that may have been applied to the instance then
					// remove the command.
					if (command.effectType === "blink") {					
						this.opacity = 1;
					}
					this.drawOffset.x = this.drawOffset.y = this.drawOffset.z = 0;
					commands.splice(j, 1);
				}
				break;

			case "destroyself":
				// Destroys the calling instance.
				//   commands.push({
				//     type: "destroySelf",
				//   });
				
				// remove the physics object
				// hack: this is nasty
				// todo: change after physics is refactored
				var o = this.physics.group.objects;
				var len = o.length;
				var i = 0;
				for (i = 0; i < len; i++) {
					if (o[i] === this.physics) {
						o.splice(i, 1);
					}
				}
				
				// remove the instance
				delete xlib.actorStore.instances[this.name];
				
				// remove this command
				commands.splice(j, 1);
				break;

			default:
				// unknown type; complain.
				xlib.log("Warning:  actorStore.runStateCommands() found unknown command type '" + command.type + "' for actor instance '" + this.name + "', stateId " + this.stateId + ", stateTick " + this.stateTick + ". Check the state machine for actor '" + this.actor.name + "' and correct the invalid command type.");
				// remove this command
				commands.splice(j, 1);
				break;
		}

	}

	this._freezeStateTick = freezeTicks;
	freezeTicks = 0;

	return true;
};

// appends a set of new actions to the _actionBuffer array stored on
// each instance. The oldest set of actions is culled.
xlib.actorStore.actorInstance.prototype.updateActionBuffer = function(newActions) {
	// example new action:
	//   ["punch", "jump left", ...]
	var actionBuffer = this.actionBuffer;
	var abLen = xlib.actorStore._actionBufferLength;
	// remove the first element and put the new actions on the end
	actionBuffer.splice(0, 1);
	actionBuffer[abLen - 1] = (newActions) ? newActions : [];
	// step through each action in the second-last element and remove any that
	// have the 'no buffer' flag. Those actions only get one tick on the buffer.
	// No need to do this if the actionBufferLength is 1.
	// todo: clean this up after sequence lists become objects. At that point we
	// can look the sequence up by name and step through its sequences.
	if (abLen > 1 && actionBuffer[abLen - 2]) {
		// j exists purely to avoid a property lookup each loop
		var i = actionBuffer[abLen - 2].length;
		var sequence = this.actor.sequenceList;
		var j = sequence.length;
		var k;
		while (i--) {
			k = j;
			while (k--) {
				if (actionBuffer[abLen - 2][i] === sequence[k].name && sequence[k].noBuffer) {
					// nuke the action. Safe since we're looping backwards
					actionBuffer[abLen - 2].splice(i, 1);
				}
			}
		}
	}
	// debug
	// if (actionBuffer.toString() !== ",,") {
	//	window.xlib.log(actionBuffer[0][0].toString() + "     " + actionBuffer[0][1].toString() + "     " + actionBuffer[0][2].toString());
	// }
	return true;
};
// find collisions between this actor instance and every other active instance
// by comparing collision boxes that belong to their current animation frame.
// findType and inType specify the two types of collision boxes to compare.
// Returns an array of instances with collision boxes of type againstType
// where a collision was detected. For example, if findType is 1 (hitBox) and
// inType is 0 (bodyBox) then an array of instances with bodyBox
// collision boxes will be returned.
// Return format:
//   [
//     [collisionBoxIndex, collisionBoxIndex],
//     [collisionBoxIndex, collisionBoxIndex],
//   ]
xlib.actorStore.actorInstance.prototype.findInstanceCollisions = function(findType, inType, filterFunction, getOverlap) {
	// todo: optimise collision detection by sorting instances into "zones"
	// first, then running detection only on instances inside the same zone
	if (findType === undefined || inType === undefined) return false;
	var xlib = window.xlib;
	var instances = this.instances;
	var instanceFind, instanceIn;
	var physicsFind, physicsIn;
	var animFrameFind, animFrameIn;

	// this code was adapted from actorStore.findInstanceCollisions(), which finds
	// collisions between all instances. The major modification is the removal
	// of outer loop i that was responsible for stepping through each instance
	// looking for findType boxes.
	// j is inner loop 1 -- stepping through each instance with collisionBoxes of type inType.
	var j;
	// k is inner loop 2 -- stepping through each collisionBox in i.
	var k;
	// l is inner loop 3 -- stepping through each collisionBox in j.
	var l;
	// convenience variables for skipping property lookups
	var boxesFind, boxesIn;
	// temp vars for collision box x and y after aligning to their actors
	var x1, y1, x2, y2;

	// redundant, but maintains nomenclature of original function
	instanceFind = this;
	// reset the collision array
	instanceFind.collisionsThisTick = [];
	// grab the appropriate object containing the collision boxes
	// early exit: if there's no animation, there's no collision boxes
	if (!instanceFind.animInstance) return [];
	// get the appropriate animation frame frame for the instance's animTick
	animFrameFind = instanceFind.animInstance.getCurrentFrame(instanceFind.animTick);
	boxesFind = (findType === 0) ? animFrameFind.bodyBoxes : animFrameFind.hitBoxes;
	// if this instance doesn't have collision boxes of type findType, skip
	if (!boxesFind.length) return [];
	// convenience var used down in the k loop
	physicsFind = instanceFind.physics;
	// step through each instance
	for (j in instances) {
		instanceIn = instances[j];
		// if we're comparing the same instance, skip
		if (instanceFind === instanceIn) continue;
		// grab the appropriate object containing the collision boxes
		// early exit: if there's no animation, there's no collision boxes
		if (!instanceIn.animInstance) continue;
		animFrameIn = instanceIn.animInstance.getCurrentFrame(instanceIn.animTick);
		boxesIn = (inType === 0) ? animFrameIn.bodyBoxes : animFrameIn.hitBoxes;
		// if this instance doesn't have collision boxes of type findType, skip
		if (!boxesIn.length) continue;
		// convenience var used down in the l loop
		physicsIn = instanceIn.physics;
		// reset k to the last box in boxesFind
		k = boxesFind.length;
		innerloopl:
		while (k--) {
			// get the position of the 'find' collision box relative to the instance position
			switch (instanceFind.axisFlip) {
				case 0:
					x1 = Math.round(physicsFind.x) + boxesFind[k].x;
					y1 = Math.round(physicsFind.y) + boxesFind[k].y;
					break;
				case 1:
					x1 = Math.round(physicsFind.x + physicsFind.w) - boxesFind[k].x - boxesFind[k].w;
					y1 = Math.round(physicsFind.y) + boxesFind[k].y;
					break;
				case 2:
					x1 = Math.round(physicsFind.x) + boxesFind[k].x;
					y1 = Math.round(physicsFind.y + physicsFind.h) - boxesFind[k].y - boxesFind[k].h;
					break;
				case 4:
					x1 = Math.round(physicsFind.x + physicsFind.w) - boxesFind[k].x - boxesFind[k].w;
					y1 = Math.round(physicsFind.y + physicsFind.h) - boxesFind[k].y - boxesFind[k].h;
					break;
			}
			// reset l to the last box in boxesIn
			l = boxesIn.length;
			while (l--) {
				// get the position of the 'find' collision box relative to the instance position
				switch (instanceIn.axisFlip) {
					case 0:
						x2 = Math.round(physicsIn.x) + boxesIn[l].x;
						y2 = Math.round(physicsIn.y) + boxesIn[l].y;
						break;
					case 1:
						x2 = Math.round(physicsIn.x + physicsIn.w) - boxesIn[l].x - boxesIn[l].w;
						y2 = Math.round(physicsIn.y) + boxesIn[l].y;
						break;
					case 2:
						x2 = Math.round(physicsIn.x) + boxesIn[l].x;
						y2 = Math.round(physicsIn.y + physicsIn.h) - boxesIn[l].y - boxesIn[l].h;
						break;
					case 4:
						x2 = Math.round(physicsIn.x + physicsIn.w) - boxesIn[l].x - boxesIn[l].w;
						y2 = Math.round(physicsIn.y + physicsIn.h) - boxesIn[l].y - boxesIn[l].h;
						break;
				}

				// finally, compare something.
				// note: code stolen from boundingBox2D.intersect() to avoid
				// function call overhead.
				if (x2 > x1 + boxesFind[k].w ||
				    x2 + boxesIn[l].w < x1 ||
				    y2 > y1 + boxesFind[k].h ||
				    y2 + boxesIn[l].h < y1) continue;
				// found a collision. Check it against the user function if one is set.
				if (filterFunction && !filterFunction(instanceFind, k, instanceIn, l)) continue;
				// Make a new array element containing the current instanceFind and
				// its current collision box plus the current instanceIn and its
				// current collision box. Add it to the collisions array.
				// If the caller requested the overlap box, include it too.
				if (!getOverlap) {
					instanceFind.collisionsThisTick.push([boxesFind[k], instanceIn, boxesIn[l]]);
				}
				else {
					instanceFind.collisionsThisTick.push([
						boxesFind[k],
						instanceIn,
						boxesIn[l],
						new xlib.boundingBox2D(Math.max(x1, x2),
						                       Math.max(y1, y2),
						                       Math.min(x1 + boxesFind[k].w, x2 + boxesIn[l].w) - Math.max(x1, x2),
						                       Math.min(y1 + boxesFind[k].h, y2 + boxesIn[l].h) - Math.max(y1, y2))
					]);
				}
			} // move onto the next instanceIn collision box.
		} // move onto the next instanceFind collision box.
	} // move onto the next instanceIn.

	return true;
};
xlib.actorStore.actorInstance.prototype.faceInstance = function(instance, includeAxes) {
	// todo: this entire function will need to be rewritten when axisFlip is
	// replaced with a 3-axis angular direction.
	if (!instance) {
		xlib.log("Error:    actorInstance.faceInstance() was given invalid instance object.");
		return false;
	}
	
	// convenience
	var H = 0x1;
	var V = 0x2;
	
	// used to store which axes changed.
	var changedAxes = [false, false, false];
	// horizontal
	if (includeAxes & H) {
		// get the horizontal center of both instances and turn if not facing.
		if (((this.physics.x + this.physics.w) / 2) <= ((instance.physics.x + instance.physics.w) / 2)) {
			// left of given instance. if we're not already facing right, switch.
			if (this.axisFlip & H && this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_RIGHT === xlib.INSTANCEDIRECTION_RIGHT) {
				// flip bit 0
				this.axisFlip ^= H;
				// alternate method that always unsets bit 0
				//this.axisFlip &= ~1;
				changedAxes[0] = true;
			}
		}
		else {
			// right of given instance. if we're not already facing left, switch.
			if (!(this.axisFlip & H) && this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_LEFT) {
				// flip bit 0
				this.axisFlip ^= H;
				// alternate method that always sets bit 0
				//this.axisFlip |= 1;
				changedAxes[0] = true;
			}
		}
	}
	
	// vertical
	if (includeAxes & V) {
		// get the vertical center of both instances and turn if not facing.
		if (((this.physics.y + this.physics.h) / 2) <= ((instance.physics.y + instance.physics.h) / 2)) {
			// above given instance. if we're not already facing up, switch.
			if (this.axisFlip & V && this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_UP) {
				this.axisFlip ^= V;
				changedAxes[1] = true;
			}
		}
		else {
			// below given instance. if we're not already facing down, switch.
			if (!(this.axisFlip & V && this.actor.actorConstants.directionsAllowed & xlib.INSTANCEDIRECTION_DOWN)) {
				this.axisFlip ^= V;
				changedAxes[1] = true;
			}
		}
	}
	
	return changedAxes;
}

xlib.playerStore = {
	players: {},
	addPlayer: function(name, bindingList, actorInstance) {
		// todo: most of this.
		if (this.players[name] !== undefined) {
			xlib.log("Error:    playerStore.addPlayer() failed to add player '" + name + "'; name invalid or already in use.");
			return false;
		}
		var player = new this.player(name, bindingList, actorInstance);
		if (Object.isEmpty(player)) {
			xlib.log("player:   playerStore.addPlayer() failed to add player '" + name + "': invalid data passed.");
			return false;
		}
		this.players[name] = player;
		return player;
	}
};
xlib.playerStore.player = function(name, bindingList, actorInstance) {
	if (!name) {
		xlib.log("Error:    playerStore.player constructor: missing name in parameters. Can't create player.");
		return false;
	}
	this.name = name;
	// create a prototype-backed binding table so that we can reset it to the
	// original if necessary.
	this.bindingListOriginal = bindingList || {};
	this.bindingList = Object.create(bindingList);

	this.actorInstance = actorInstance ? actorInstance : null;

	// custom vars object to store arbitrary information (ammo, score, etc)
	this.userVars = {};

	// hack: todo: see note in setActorInstance() below
	if (actorInstance) actorInstance.player = this;
};

// bindingList is a lookup object for mapping a physical input to an action.
// Notes:
//   When naming bindings, directionals should use an uppercase name with all
//   other actions lowercase. This reduces developer confusion when a developer
//   tries to use 'd' to represent the 'down' action and then accidentally
//   later binds the letter 'd' and overwrites the earler name.
//   Directionals can be are relative to how the game perceives them (eg.
//   a player character turned one way or another) and may be reversed or
//   otherwise affected.
//   Absolute directionals begin with an underscore and are absolute to
//   the screen orientation.
// Example:
//   bindingList: {
//     s: "one",
//     F: "forward",
//     _L: "left"
//   }
// For a detailed explanation of the binding format, see the notes at the top
// of inputStore.
//
xlib.playerStore.player.prototype.setbindingList = function(bindingList) {
	if (!bindingList) return false;
	this.bindingList = bindingList;
	return true;
};
xlib.playerStore.player.prototype.setActorInstance = function(actorInstance) {
	if (!actorInstance) return false;
	this.actorInstance = actorInstance;
	return true;
};
xlib.playerStore.player.prototype.setActorInstance = function(instance) {
	// hooks a player's controls up to an actor instance.
	// This function accepts null or undefined for the instance in order
	// to remove the instance reference.
	// remove the reference to the player from the instance if it's set.
	if (this.actorInstance && this.actorInstance.player) this.actorInstance.player = null;
	this.actorInstance = instance;
	// hack: todo: We're adding this to the instance as well for fast
	// lookup inside runStateMachines(). We need access to the swapBindings
	// function to switch directions (command = ["swapBindings"]) but checking
	// the player vars to see who owns the current instance would have to
	// be done in a loop. Note: At one point I was considering having the
	// actor instance own the information on which player was controlling
	// it.
	instance.player = this;
	return true;
};
xlib.playerStore.player.prototype.swapBindings = function(bindName1, bindName2) {
	// convenience function to switch one binding's value with another, for
	// example left/right or up/down. Useful in a game where a character can
	// face multiple directions and the directions used to trigger input
	// sequences must match the character's direction.
	// Both parameters are a string that match the name of the key in the object.
	// If both keys are found, return true.
	var bt = this.bindingList;
	if (bt[bindName1] === undefined || bt[bindName2] === undefined) return false;
	// switcharooney
	var temp = bt[bindName1];
	bt[bindName1] = bt[bindName2];
	bt[bindName2] = temp;
	if (xlib.debug) xlib.log("Input:    swapped bindings for '" + bindName1 + "' and '" + bindName2 + "'");
	return true;
};
xlib.playerStore.player.prototype.resetBindings = function() {
	// convenience function to reset the player's bindings to the original set
	// provided when the player was created.
	this.bindingList = Object.create(this.bindingListOriginal);
	return true;
};

xlib.inputStore = {

	// inputbuffer contains the last 60 frames of up, down and hold events.
	_inputBufferLength: 60,
	_inputBuffer: [],
	
	// flags used in getInputBuffer() to determine which devices to poll.
	_useKeyboard: false,
	_useMouse: false,
	_useGamepads: false,

	// todo: onKeyStateChange, onGamepadAxisStateChange, onGamepadButtonStateChange

	// todo: sequence matching currently ignores adjacent diagnonals in places where
	// it may matter to some games. Sonic booms will trigger from Charge DB,DF,X
	// at the moment, ignoring the unrelated down input. Let the sequence parts
	// define whether they want this behaviour.

	// Examples of inputSequence parsing from Mugen's format:
	//   done:  ~40$B, $F, z      ~ is release, number is min hold ticks
	//   done:  /B                / is hold
	//   done:  %50B              % is hold, but triggers only every 50 ticks
	//   todo:  $D,AB             $ is allow adjacent diagonals (currently always, see above)

	// Follow this general rule when defining a sequence:
	//
	//                       sequence ticks <= action ticks
	//  (length allowed for input in ticks)    (length of the game action in ticks)
	//
	// If the sequence ticks is larger, players will be able to repeat the last
	// inputEvent to get the sequence to match again, triggering the action for free.


	// Bindings format used for mapping physical device mappings to game-internal
	// bind names: (previously known as keyMaps or inputMaps)
	//   [
	//     [
	//       deviceType: 0,  // see DEV_* vars in inputStore
	//       deviceIndex: 0, // index to specific device of type
	//       inputMethod: 0, // see METHOD_* vars
	//       inputCode: 65,  // key code, axis index or button index
	//       inputValueMin: 0.8 // minimum required pressure or axis value
	//       inputValueMax: 1 // maximum required pressure or axis value
	//     ],
	//     [...]
	//   ]


	// Sequences are a series of input presses, releases and holds. They describe
	// a discrete chain of input that identifies a particular action such as
	// "punch", "jump", etc. They're organised into groups, and are stored in
	// a structure like this:
	// sequences {
	//   .sequenceListName = [
	//     [0] = {
	//       ticks: 30,
	//       parts = [
	//         {
	//           bindNames: ["x", "y"],
	//           inputType: 1,
	//           stateTick: 1
	//         },
	//         ...
	//       ],
	//       [ ... ],
	//     [ ... ],
	//   ]
	// }
	sequences: {},
	
	// Notes on inputEvents used in the inputBuffer and the following functions:
	//
	// An inputEvent is an array containing the following elements:
	//   0: device type. This refers to the type of physical device that created
	//      the event. 0 is keyboard, 1 is mouse (todo: nyi), and 2 is gamepad.
	//   1: device index. This refers to which particular device created the
	//      event. Always 0 when device type is keyboard and mouse.
	//   2: input method. This refers to whether the input came from a button (0)
	//      or a directional axis (1). Always 0 when device type is keybound,
	//      and always 1 device type is mouse. Gamepads may contain multiple
	//      input methods. Other methods may be added in the future.
	//   3: input code. key code, axis index or button index.
	//   4: input type. 1 for press, 2 for release, 4 for hold.
	//   5: input value. pressure or axis value sampled from the input method.
	//      Non-analog methods use 0 or 1. Analog methods use a floating range
	//      between 0 and 1.
	//   6: number of ticks the input has been in the same state (pressed,
	//      released, etc).
	
	DEV_KEYBOARD: 0,
	DEV_MOUSE: 1,
	DEV_GAMEPAD: 2,
	
	METHOD_BUTTON: 0,
	METHOD_AXIS: 1,
	
	TYPE_PRESS: 1,
	TYPE_RELEASE: 2,
	TYPE_HOLD: 4,	

	// converts any simple bindings on an object by running convertSimpleBinding()
	// on each property.
	convertSimplebindingList: function(table) {
		if (!table) {
			xlib.log("Error:    xlib.inputStore.convertSimplebindingList() given invalid table.");
			return false;
		}
		var
			p,
			i,
			len,
			r;
		for (p in table) {
			if (table.hasOwnProperty(p)) {
				if (typeof table[p] === "string" || table[p] instanceof String) {
					// convert it to an array so we can process it as per normal below.
					table[p] = [table[p]];
				}
				len = table[p].length;
				for (i = 0; i < len; i++) {
					if (typeof table[p][i] === "string" || table[p][i] instanceof String || table[p][i].length === 1 || table[p][i].length === 3) {
						r = this.convertSimpleBinding(table[p][i]);
						if (!r) {
							xlib.log("Error:    xlib.inputStore.convertSimplebindingList() given table containing invalid simple bindings.");
							return false;
						}
						table[p][i] = r;
					}
				}
			}
		}
		return table;
	},
	
	// converts a simple binding (a string, or an array containing a string and two
	// float values representing a pressure range) to to the format used internally.
	// Examples:
	//   ["kb_z"], 1, 1]                   [0, 0, 0, 90, 1, 1]
	//   ["z"]                             [0, 0, 0, 90, 1, 1]
	//   "z"                               [0, 0, 0, 90, 1, 1]
	//   ["gamepad_0_button_0", -.95, -1]  [2, 0, 0,  0, -.95, -1]
	//   ["gamepad_3_axis_2"]              [2, 3, 1,  2, 1, 1]
	convertSimpleBinding: function(simpleBinding) {
		if (!simpleBinding) {
			xlib.log("Error:    xsor.inputStore.translateSimpleBinding() missing required parameter.given invalid binding (must be string, or array containing 1 or 3 elements).");
			return false;
		}
	
		// if we've received a string, convert it into an array with default pressure
		// values.
		if (typeof simpleBinding === "string" || simpleBinding instanceof String) {
			simpleBinding = [simpleBinding, 1, 1];
		}
		else if (simpleBinding.length !== 3) {
			xlib.log("Error:    xsor.inputStore.translateSimpleBinding() given invalid binding (must be string, or array containing 1 or 3 elements).");
			return false;
		}
		else if (isNaN(simpleBinding[1]) || isNaN(simpleBinding[2])) {
			xlib.log("Error:    xsor.inputStore.translateSimpleBinding() given pressure value that is not a number.");
			return false;
		}
		
		var
			patternFull    = /^(kb|mouse|gamepad)_(\d+)_(button|axis)_(\d+|([a-z]+\d*))$/,
			patternNoIndex = /^(kb|mouse|gamepad)_(button|axis)_(\d+|([a-z]+\d*))$/,
			patternKBShort = /^(kb)_(\d+|([a-z]+\d*))$/,
			patternKBMin   = /^(\d+|([a-z]+\d*))$/,
			r,
			arr = [];
			
		// try to find a pattern that matches the string
		r = simpleBinding[0].match(patternFull);
		if (r) {
			// take elements 1, 2, 3, 4 and insert as 0, 1, 2, 3
			arr = [r[1], r[2] * 1, r[3], r[4]];
		}
		else {
			r = simpleBinding[0].match(patternNoIndex);	
			if (r) {
				// take elements 1, 2, 3 and insert as 0, 2 and 3
				arr = [r[1], 0, r[2], r[3]];
			}
			else {
				r = simpleBinding[0].match(patternKBShort);	
				if (r) {
					// take elements 1, 2 and insert as 0, 3
					arr = [r[1], 0, "button", r[2]];
				}
				else {
					r = simpleBinding[0].match(patternKBMin);	
					if (r) {
						// take element 1 and insert as 3
						arr = ["kb", 0, "button", r[1]];
					}
				}
			}
		}
		
		if (!arr.length) return false;
	
		// translate keyword values to numeric
		switch (arr[0]) {
			case "kb":
				arr[0] = this.DEV_KEYBOARD;
				break;
			case "mouse":
				arr[0] = this.DEV_MOUSE;
				break;
			case "gamepad":
				arr[0] = this.DEV_GAMEPAD;
				break;
		}
		switch (arr[2]) {
			case "button":
				arr[2] = this.METHOD_BUTTON;
				break;
			case "axis":
				arr[2] = this.METHOD_AXIS;
				break;
		}
		if (arr[0] === this.DEV_KEYBOARD && /^[a-z]/.test(arr[3])) {
			// convert the keyboard constant
			if (this.keyboard.keyTable[arr[3]] === undefined) {
				xlib.log("Error:    xlib.inputStore.translateSimpleBinding() given invalid keyboard constant '" + arr[3] + "'.");
				return false;
			}
			arr[3] = this.keyboard.keyTable[arr[3]];
		}
		
		// convert any numerical strings to real numebrs
		arr[1] = arr[1] * 1;
		arr[3] = arr[3] * 1;
	
		// push the pressure values
		arr.push(simpleBinding[1], simpleBinding[2]);
		
		return arr;
	},

	keyboard: {
		// holds a reference to the capture element.
		_keyCaptureElement: null,
		// array of keys (string codes from keyTable) to ignore in captured input.
		// The default is to ignore tab, allowing focus changes and alt-tabbing from
		// the capture element.
		_ignoreKeysArray: [],
		// buttons is an array, indexed by keyCode, with each element containing a
		// number between 0 and 1 that indicates whether a key is pressed (1) or
		// released (0).
		buttons: [],
		// buttonsTick indicates how many ticks the key has been in its current
		// state.
		buttonsTick: [],
		// buttonsDelta contains the difference between the last tick's state
		// and the current one. For keyboards, a delta of 0 indicates no state
		// change, 1 indicates a new press, and -1 indicates a new release.
		buttonsDelta: [],
		// array containing the gathered input events. See notes above regarding
		// input event structure.
		_inputEvents: [],
				
		// contains all the useful keyCodes
		// thanks to http://www.cambiaresearch.com/c4/702b8cd1-e5b0-42e6-83ac-25f0306e3e25/Javascript-Char-Codes-Key-Codes.aspx
		keyTable: {
			// note that grave is called tilde here since it's a more common usage.
			backspace:8,tab:9,enter:13,shift:16,ctrl:17,alt:18,pause:19,capslock:20,escape:27,pageup:33,pagedown:34,end:35,home:36,left:37,up:38,right:39,down:40,ins:45,del:46,zero:48,one:49,two:50,three:51,four:52,five:53,six:54,seven:55,eight:56,nine:57,a:65,b:66,c:67,d:68,e:69,f:70,g:71,h:72,i:73,j:74,k:75,l:76,m:77,n:78,o:79,p:80,q:81,r:82,s:83,t:84,u:85,v:86,w:87,x:88,y:89,z:90,leftwindowkey:91,rightwindowkey:92,select:93,numpad0:96,numpad1:97,numpad2:98,numpad3:99,numpad4:100,numpad5:101,numpad6:102,numpad7:103,numpad8:104,numpad9:105,multiply:106,add:107,subtract:109,decimalpoint:110,divide:111,f1:112,f2:113,f3:114,f4:115,f5:116,f6:117,f7:118,f8:119,f9:120,f10:121,f11:122,f12:123,numlock:144,scrolllock:145,semicolon:186,equal:187,comma:188,dash:189,period:190,forwardslash:191,tilde:192,openbracket:219,backslash:220,closebracket:221,singlequote:222
		},
		
		init: function(keyCaptureElement, ignoreKeysArray) {
			// initialise and reset the buttons array and set up the key events
			// on the capture element.

			// store a reference to the capture element.
			// This is a workaround for not being able to use the body in some
			// browsers. We use 'window' instead, which will give us the same result.
			if (!keyCaptureElement || (keyCaptureElement.tagName && keyCaptureElement.tagName.toLowerCase() === "body")) {
				this._keyCaptureElement = window;
			}
			else {
				this._keyCaptureElement = keyCaptureElement;
			}
	
			// ignoreKeysArray are stored differently on the object for faster lookup
			// in the keyboard event functions.
			if (ignoreKeysArray) {
				i = ignoreKeysArray.length;
				while (i--) {
					this._ignoreKeysArray[ignoreKeysArray[i]] = true;
				}
			}
			else {
				this._ignoreKeysArray[9] = true;
				this._ignoreKeysArray[116] = true;
			}
	
			// fill buttons* vals with defaults
			var buttons = this.buttons;
			var buttonsTick = this.buttonsTick;
			var buttonsDelta = this.buttonsDelta;
			// hardcoded number of keys
			i = 256;
			while (i--) {
				buttons[i] = 0;
				buttonsTick[i] = 0;
				buttonsDelta[i] = 0;
			}
			
			var kb = this;
			var inputStore = xlib.inputStore;
			
			// handler functions
			var keyDown = function(e) {
				if (e.target.tagName && e.target.tagName.toLowerCase() === "input") return true;
				// ignore keys stored in _ignoreKeysArray
				if (kb._ignoreKeysArray[e.keyCode]) return true;
				// keydown fires at the keyboard repeat rate, and thus any keydown event
				// that triggers when a key is already down should be thrown away.
				// When a key is pressed it wasn't before, store the value in an array.
				if (kb.buttons[e.keyCode] === 0) {
					// record a press inputEvent with the existing buttonsTick.
					kb._inputEvents.push([
						inputStore.DEV_KEYBOARD,
						0,
						inputStore.METHOD_BUTTON,
						e.keyCode,
						inputStore.TYPE_PRESS,
						1,
						kb.buttonsTick[e.keyCode]
					]);
					// mark the key as being pressed
					kb.buttons[e.keyCode] = 1;
					// reset tick. Use 0 since it will be incremented when input is
					// finalised for this frame.
					kb.buttonsTick[e.keyCode] = 0;
					// remember the change
					kb.buttonsDelta[e.keyCode] = 1;
				}
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			
			var keyUp = function(e) {
				if (e.target.tagName && e.target.tagName.toLowerCase() === "input") return true;
				// ignore keys stored in _ignoreKeysArray
				if (kb._ignoreKeysArray[e.keyCode]) return true;
				if (kb.buttons[e.keyCode] === 1) {
					// record a release inputEvent with the existing buttonsTick.
					kb._inputEvents.push([
						inputStore.DEV_KEYBOARD,
						0, // device index
						inputStore.METHOD_BUTTON,
						e.keyCode, // input code
						inputStore.TYPE_RELEASE,
						0, // input value
						kb.buttonsTick[e.keyCode]
					]);
					// mark the key as not being pressed
					kb.buttons[e.keyCode] = 0;
					// reset tick. Use 0 since it will be incremented when input is
					// finalised for this frame.
					kb.buttonsTick[e.keyCode] = 0;
					// remember the change
					kb.buttonsDelta[e.keyCode] = -1;
				}
				e.preventDefault();
				e.stopPropagation();
				return false;
			}
			
			// handler callbacks
			this._keyCaptureElement.addEventListener("keydown", keyDown, null);
			this._keyCaptureElement.addEventListener("keyup", keyUp, null);
			
			// todo: find a better way to address the parent
			xlib.inputStore._useKeyboard = true;
		},
			
		isCapturing: function() {
			// returns whether the inputStore is able to capture input right now
			// (eg. does the capture element have focus).
			// todo: test this for window/body/html. I don't think it works.
			if (document.activeElement === this._keyCaptureElement) return true;
			return false;
		},
		
		// retrieves the final array of input events for the keyboard. This function
		// should be called each tick to ensure the hold time values are accurate.
		getInputEvents: function() {
			var buttons = this.buttons;
			var buttonsTick = this.buttonsTick;
			var inputEvents = this._inputEvents;
			var inputStore = xlib.inputStore;
			var i = buttons.length;
			// step through all buttons, increment their buttonsTick and create hold
			// events for them. This is horrible but necessary because of how keyDown
			// events work (keyboard repeat rate).
			while (i--) {
				// increment the buttonsTick for each key.
				buttonsTick[i]++;
				// if the key is being held, create a hold event.
				if (buttons[i] === 1) {
					inputEvents.push([
						inputStore.DEV_KEYBOARD,
						0,
						inputStore.METHOD_BUTTON,
						i,
						inputStore.TYPE_HOLD,
						1,
						buttonsTick[i]
					]);
				}
			}
			return inputEvents;
		},
		
		// not calling this function after processing the tick's inputEvents will
		// result in the keyboard inputEvent array filling up with multiple ticks
		// of input.
		prepareDeviceForNextTick: function() {
			// kill the stored input events from the old tick/frame
			this._inputEvents.length = 0;
			// reset the changes array.
			var
				buttonsDelta = this.buttonsDelta,
				i = buttonsDelta.length;
			while (i--) {
				buttonsDelta[i] = 0;
			}
		}
	},
	mouse: {
		// todo: nyi
		init: function() {
		}
	},
	// the gamepads object will be replaced with a reference to the
	// navigator.gamepads object or filled with the gamepads as they are
	// connected.
	gamepads: {
		init: function() {
			// if the gamepads array isn't available, try the prefixed versions, then
			// fall back to an empty array.
			if (!navigator.gamepads) {
				navigator.gamepads = navigator.webkitGamepads || navigator.mozGamepads || [];
				xlib.inputStore.gamepads = navigator.gamepads;
			}
			
			// handlers functions for connected/disconnected.
			var connect = function(e) {
				// if the gamepad passed in the event isn't in the array, add it
				// (old Moz nightly build)
				if (!navigator.gamepads[e.gamepad.index] !== e.gamepad) {
					navigator.gamepads[e.gamepad.index] = e.gamepad;
				}
				// loop through all the gamepads and extend them.
				// This would be better done using .prototype, but the browser creates
				// the gamepad objects before we can add to .prototype.
				// We need to loop here because multiple gamepads may have been
				// provided when one is connected (W3C spec), may be provided
				// one-per-event then added to the gamepads array manually (old Moz),
				// or may be added automically to the gamepads array (all).
				var i = navigator.gamepads.length;
				while (i--) {
					// the gamepads array is not guaranteed to be dense (contiguous) due
					// to the browser trying to maintain gamepad indexes for convenience,
					// so check before we add properties.
					if (navigator.gamepads[i] && !navigator.gamepads[i]._inputEvents) {
						// .buttons and .axes are provided by the default Gamepad prototype
						navigator.gamepads[i].buttonsTick = [];
						navigator.gamepads[i].buttonsDelta = [];
						navigator.gamepads[i].axesTick = [];
						navigator.gamepads[i].axesDelta = [];
						// special case for axis values since we want to limit the amount of
						// miniscule events triggered by analog axes. This array stores the
						// last axes value that caused an event to be recorded.
						navigator.gamepads[i]._axesLastEventState = [];
						// since we're not using events, we won't be notified when a
						// button's state changes. Instead, store the last tick's states.
						navigator.gamepads[i]._buttonsLastState = [];
						navigator.gamepads[i]._axesLastState = [];
						navigator.gamepads[i]._inputEvents = [];
						// todo: better way to address parent object
						navigator.gamepads[i].isCapturing = xlib.inputStore._gamepadFunctions.isCapturing;
						navigator.gamepads[i].getInputEvents = xlib.inputStore._gamepadFunctions.getInputEvents;
						navigator.gamepads[i].prepareDeviceForNextTick = xlib.inputStore._gamepadFunctions.prepareDeviceForNextTick;
					}
				}
			}
			var disconnect = function(e) {
				// todo: allow registering for callbacks so a game can pause if
				// a controller becomes unavailable
			}
			
			// handler callbacks
			window.addEventListener("gamepadConnected", connect, false);
			window.addEventListener("gamepadDisconnected", disconnect, false);
			window.addEventListener("MozGamepadConnected", connect, false);
			window.addEventListener("MozGamepadDisconnected", disconnect, false);
			window.addEventListener("webkitgamepadconnected", connect, false);
			window.addEventListener("webkitgamepaddisconnected", disconnect, false);
		}
	},
	_gamepadFunctions: {
		isCapturing: function() {
			return this.connected;
		},
		getInputEvents: function() {
			var
				i = 0,
				buttons = this.buttons,
				buttonsLen = this.buttons.length,
				buttonsTick = this.buttonsTick,
				buttonsDelta = this.buttonsDelta,
				buttonsLastState = this._buttonsLastState,
				axes = this.axes,
				axesLen = this.axes.length,
				axesTick = this.axesTick,
				axesDelta = this.axesDelta,
				axesLastState = this._axesLastState,
				axesLastEventState = this._axesLastEventState,
				inputEvents = this._inputEvents,
				inputStore = xlib.inputStore,
				axisNormalised;
			// if custom arrays are empty, set up initial values
			if (buttonsLen && !buttonsLastState.length) {
				i = buttonsLen;
				while (i--) {
					// all of these will be updated later in the function
					buttonsTick[i] = 0;
					buttonsDelta[i] = 0;
					buttonsLastState[i] = buttons[i];
				}
			}
			if (axesLen && !axesLastState.length) {
				i = axesLen;
				while (i--) {
					axesTick[i] = 0;
					axesDelta[i] = 0;
					axesLastState[i] = axes[i],
					axesLastEventState[i] = axes[i];
				}
			}

			// since we're not using events, we need to check each current state
			// against the last recorded state to determine changes and delta values.
			i = buttonsLen;
			while (i--) {
				// record any input events
				if (buttons[i] !== buttonsLastState[i]) {
					if (buttons[i] === 1) {
						// pressed
						inputEvents.push([
							inputStore.DEV_GAMEPAD,
							this.index, // device index
							inputStore.METHOD_BUTTON,
							i, // input code
							inputStore.TYPE_PRESS,
							buttons[i], // input value
							buttonsTick[i] // input ticks
						]);
						buttonsTick[i] = 0;
					}
					else {
						// release
						inputEvents.push([
							inputStore.DEV_GAMEPAD,
							this.index, // device index
							inputStore.METHOD_BUTTON,
							i, // input code
							inputStore.TYPE_RELEASE,
							buttons[i], // input value
							buttonsTick[i] // input ticks
						]);
						buttonsTick[i] = 0;
					}
					// calc button delta
					buttonsDelta[i] = buttons[i] - buttonsLastState[i];
				}
				buttonsTick[i]++;
				if (buttons[i] === 1) {
					// hold
					inputEvents.push([
						inputStore.DEV_GAMEPAD,
						this.index, // device index
						inputStore.METHOD_BUTTON,
						i, // input code
						inputStore.TYPE_HOLD,
						buttons[i], // input value
						buttonsTick[i] // input ticks
					]);
				}
				// remember current state for next time
				buttonsLastState[i] = buttons[i];
			}
			i = axesLen;
			while (i--) {
				// record any input events
				// todo: should we use the same press and release 'direction' logic
				// below for buttons, just in case buttons can be analog?
				// todo: make dead zone (abs > .02) configurable
				// todo: make movement granularity (lES + .02) configurable
				// todo: truncate values before comparison
				// http://stackoverflow.com/questions/2125715/javascript-trunc-function
				
				// attempt to normalise dead zones. axes[] is readonly according to spec
				// so use a variable in its place.
				if (axes[i] > .98) {
					axisNormalised = 1;
				}
				else if (axes[i] < -.98) {
					axisNormalised = -1;
				}
				else if (axes[i] > -.02 && axes[i] < .02) {
					axisNormalised = 0;
				}
				else {
					axisNormalised = axes[i];
				}
				
				if (axisNormalised !== axesLastState[i]) {
					if ((axisNormalised > .02 && axisNormalised > axesLastEventState[i] + .02) ||
						  (axisNormalised < -.02 && axisNormalised < axesLastEventState[i] - .02)) {
						// pressed
						inputEvents.push([
							inputStore.DEV_GAMEPAD,
							this.index, // device index
							inputStore.METHOD_AXIS,
							i, // input code
							inputStore.TYPE_PRESS,
							axisNormalised, // input value
							axesTick[i] // input ticks
						]);
						axesTick[i] = 0;
						// update lastEventState so that we can use it to judge when to next
						// create an event.
						axesLastEventState[i] = axisNormalised;
					}
					else if ((axisNormalised < .92 && axisNormalised < axesLastEventState[i] - .02) ||
						       (axisNormalised > -.98 && axisNormalised > axesLastEventState[i] + .02)) {
						// release
						inputEvents.push([
							inputStore.DEV_GAMEPAD,
							this.index, // device index
							inputStore.METHOD_AXIS,
							i, // input code
							inputStore.TYPE_RELEASE,
							axisNormalised, // input value
							axesTick[i] // input ticks
						]);
						axesTick[i] = 0;
						// update lastEventState so that we can use it to judge when to next
						// create an event.
						axesLastEventState[i] = axisNormalised;
					}
					// calc axes delta
					axesDelta[i] = axisNormalised - axesLastState[i];
				}
				axesTick[i]++;

				if ((axisNormalised >= .02 || axisNormalised <= -.02) && Math.abs(axisNormalised - axesLastEventState[i]) <= .2) {
					// hold
					inputEvents.push([
						inputStore.DEV_GAMEPAD,
						this.index, // device index
						inputStore.METHOD_AXIS,
						i, // input code
						inputStore.TYPE_HOLD,
						axisNormalised, // input value
						axesTick[i] // input ticks
					]);
				}
				// remember current state for next time
				axesLastState[i] = axisNormalised;
			}
			
			return inputEvents;
		},
		prepareDeviceForNextTick: function() {
			// kill the stored input events from the old tick/frame
			this._inputEvents.length = 0;
			// reset the changes array.
			var
				buttonsDelta = this.buttonsDelta,
				i = buttonsDelta.length;
			while (i--) {
				buttonsDelta[i] = 0;
			}
		}
	},
	init: function() {
		// create the inputBuffer and fill with empty arrays to start
		var ib = this._inputBuffer;
		i = this._inputBufferLength;
		while (i--) {
			ib[i] = [];
		}
		xlib.inputStore._useGamepads = true;
	},
	
	// this function collates all device input for the frame and should be called
	// immediately before we want to start processing input each tick.
	getInputBuffer: function() {
		var
			ib = this._inputBuffer,
			inputEvents = [],
			keyboardInputEvents,
			mouseInputEvents,
			gamepadsInputEvents,
			i;
			
		// slice off the first element from inputBuffer
		ib.splice(0, 1);
		
		// collate the inputEvents from devices that are in use
		if (this._useKeyboard) {
			inputEvents.push.apply(inputEvents, this.keyboard.getInputEvents());
		}
		if (this._useMouse) {
			inputEvents.push.apply(inputEvents, this.mouse.getInputEvents());
		}
		if (this._useGamepads) {
			// unlike keyboard or mouse, gamepads can contain multiple devices and
			// so is an array.
			i = this.gamepads.length;
			while (i--) {
				if (this.gamepads[i]) {
					inputEvents.push.apply(inputEvents, this.gamepads[i].getInputEvents());
				}
			}
		}
		
		// append the entire collated inputEvents array to the inputBuffer
		ib.push(inputEvents);

		// testing: force feed test inputs into inputBuffer. These are ancient and
		// won't work without updating.
		/*
		// hold q, hold w, hold e (clean)
		ib[57] = [[2,81,1]];
		ib[58] = [[2,87,1],[4,81,2]];
		ib[59] = [[2,69,1],[1,81,3],[4,87,2]];
		*/
		/*
		// jab right fireball test (clean)
		ib[57] = [[2,39,1]];
		ib[58] = [[1,40,1]];
		ib[59] = [[2,81,1]];
		*/
		/*
		// jab right fireball test (with hold fluff)
		ib[55] = [[2,40,1]];
		ib[56] = [[2,39,1],[4,40,2]];
		ib[57] = [[1,40,3],[4,39,2]];
		ib[58] = [[4,39,3]];
		ib[59] = [[2,81,1],[4,39,4]];
		*/
		/*
		// jab right grand upper (clean, in one inputEvent)
		ib[59] = [[2,39,1],[1,39,1],[2,39,1],[2,81,1]];
		*/
		/*
		// jab right grand upper (clean, in one inputEvent, random order)
		ib[59] = [[2,39,1],[2,81,1],[1,39,1],[2,39,1]];
		*/
		// jab left grand upper (clean, in one inputEvent)
		// ib[59] = [[2,37,1],[1,37,1],[2,37,1],[2,81,1]];
		// UpLeft (clean)
		// ib[59] = [[4,38,1],[4,37,1]];

		// hold up, press w, press e (clean, in one inputEvent). Used to
		// test that a sequence with three sequenceParts would be found in
		// one inputBuffer element.
		// ib[59] = [[4,38,7],[2,87,1],[2,69,1]];
		
		// flurry, releasing keyboard 2 after 61 ticks
		//ib[59] = [[0, 0, 0, 50, 2, 0, 61]];
		
		return ib;
		
	},

	// call this to reset the inputEvents stored on each device. This must be
	// called after	processing input and moving to the next frame or tick.
	prepareDevicesForNextTick: function() {
		var i;
		if (this._useKeyboard) {
			this.keyboard.prepareDeviceForNextTick();
		}
		if (this._useMouse) {
			this.mouse.prepareDeviceForNextTick();
		}
		if (this._useGamepads) {
			i = this.gamepads.length;
			while (i--) {
				if (this.gamepads[i]) {
					this.gamepads[i].prepareDeviceForNextTick();
				}
			}
		}
	},

	// Step through a player's sequences and test whether each can be found
	// in the current frame's input. If a match is found, add the new action
	// to a "new actions" array. When all sequences have been tested, return
	// the new actions array.
	getNewActions: function(sequences, bindingList) {
		if (!sequences) {
			window.xlib.log("Error:    getNewActions() given nonexistent sequence array.");
			return false;
		}
		
		var sequencesLen = sequences.length;
		// early exit if no sequences
		if (!sequencesLen) return false;
		
		// todo: should we pass this in now that getInputBuffer() hands a copy to
		// the external caller?
		var inputBuffer = this._inputBuffer;
		var actions = [];
		var i = 0;
		while (i < sequencesLen) {
			if (this._matchSequence(sequences[i], bindingList, inputBuffer)) {
				// if debug is on always show matches for multi-part sequences but
				// require debug to be higher to see single-part sequences. This
				// prevents being spammed with console messages.
				if (xlib.debug > 0 && sequences[i].parts[1] !== undefined) xlib.log("Sequence: found sequence (multi-part): " + sequences[i].name);
				if (xlib.debug > 2 && sequences[i].parts[1] === undefined) xlib.log("found sequence (single-part): " + sequences[i].name);
				// Found a sequence match. Add it to the array
				// todo: should be adding an object ref
				actions.push(sequences[i].name);
			}
			i++;
		}
		return actions;
	},

	// Step through the sequence and inputBuffer, and return true if the sequence
	// is found.
	_matchSequence: function(sequence, bindingList, inputBuffer) {
		// note: where two sequences differ only on the last input, we'll need
		// to make sure the more complex one gets processed first (in this case,
		// it'll need to be later in the array). eg. ~D,DF,F,XY will need to come
		// before ~D,DF,F,X in order to be processed first, else the single-punch
		// version will always be detected first.

		// tested within the main loop to ensure we aren't testing the last sequence
		// part in the second loop onwards.
		var lastSequencePartId = sequence.parts.length - 1;
		// loop counters
		var ibl = inputBuffer.length;
		var si = lastSequencePartId;
		var sp;
		// total tick count incremented each time we move back through inputBuffer.
		// Used for testing when we exhaust the sequence tick count and give up.
		var ticks = 0;
		// iii is the inputEvent length for the current inputBuffer.
		var iii;
		// j is a copy of iii that can be decremented in a loop
		var j;
		// k is used to loop through individual sequencePart bind names
		var k;
		// l is used to loop through individual bindingList bind names
		var l;
		// used when comparing translated bindings to inputEvents in a loop
		var bindMatched = false;
		// set during loop for quick access to current inputBuffer
		var ib;
		// first run through the loop; special behaviour for the first test.
		var firstLoop = true;
		// The blacklist array is used to mark which inputEvents have already been
		// used during the inputEvent loop (j) below. This is a boolean array of
		// the same length as the current inputBuffer.
		var blacklist = [];
		// used when translating bind names back to their full physical input.
		var spBindTranslated;
		var spBindTranslatedLen;
		var spBindingsFound = 0;

		// label for escaping inner loop to move back in the inputBuffer and
		// increment the tick count.
		loop_tick:
		while (++ticks <= sequence.ticks) {

			// Is this the second loop and we're still looking for the end sequence
			// part? If so, immediately return false; for the first match, we don't
			// allow moving past the initial inputBuffer.
			// A sequence will only start matching if the last sequence part is found
			// in the last inputBuffer. This avoids matching sequences that have
			// already been found since we don't scan past the last inputBuffer.
			if (!firstLoop && si === lastSequencePartId) {
				// immediately return a match fail.
				if (xlib.debug > 2) xlib.log("exited major test first loop: ran out of inputEvents for inputBuffer[" + ibl + "]");
				return false;
			}

			// If we've already found the first part of a multi-key sequence part
			// and we get here, it means we've moved to the next inputBuffer. All the
			// bind names of a multi-input sequence part must be found in the same
			// inputEvent, so fail.
			// todo: can we allow one or two frames leeway safely? At high frame
			// rates sequences get harder to perform.
			if (spBindingsFound) {
				if (xlib.debug > 2) xlib.log("exited major test first loop: multi-key inputEvent ran out of inputEvents for inputBuffer[" + ibl + "]");
				return false;
			}

			// move back in the inputBuffer
			ibl--;
			// local var access
			ib = inputBuffer[ibl];
			// reset inputBuffer length var
			iii = ib.length;
			// j is our inputEvent counter.
			j = iii;

			// (Re)create the blacklist array. This is used to mark which inputEvents
			// have already been used during the inputEvent loop (j) below. This is
			// a boolean array of the same length as the current inputBuffer.
			blacklist = [];
			blacklist.length = iii;

			// Early exit: if the first inputBuffer is empty...
			if (inputBuffer[ibl][0] === undefined) {
				// immediately return if it's the first loop
				if (firstLoop) return false;
				// otherwise move to the next inputBuffer
				continue loop_tick;
			}

			// local var access
			sp = sequence.parts[si];
			
			// translate each element of the sequence part's bind name array back to a
			// device type, device index, input method and input code. This gives us
			// the real input required to match a sequence part, and we'll compare
			// it to inputEvents in loop j below.
			spBindTranslated = [];
			spBindTranslatedLen = sp.bindNames.length;
			for (k = 0; k < spBindTranslatedLen; k++) {
				spBindTranslated[k] = [];
				l = bindingList[sp.bindNames[k]].length;
				while (l--) {
					spBindTranslated[k][l] = bindingList[sp.bindNames[k]][l];
				}
			}
			// reset k as it's used in the test below
			k = 0;

			// Step through each inputEvent in ib.
			while (j--) {

				// Major test: if we find an inputEvent where the event, binding and
				// stateTick match our sequence part, move to the next sequence part.
				// Other unexpected input is ignored. This allows allows a sequence
				// like ~D,DF,F,X to trigger even if the user accidentally hits A as
				// well as X in the final input.
				// note: the equivalence operator (==) has higher operator precedence than
				// bitwise ops (&) so ensure they're parenthesized.

				// a sequence part may contain multiple bind names (eg down and left).
				// These need to be in the same inputEvent. Force a loop here to
				// find them all before moving to the next sequence.

				// Optimisation explanation:
				//   - First line (spBindingsFound) allows us to skip the rest of the
				//     tests in the if statement should we already have run them.
				//   - Second line tests whether the input contains the event and that
				//     we haven't blacklisted this input.
				//   - Third line test whether press, release and hold events have been
				//     held long enough to match inputTicks.
				//   - Fourth line tests hold events with a modulus requirement; the
				//     inputEvent's stateTick must be cleanly divisable by the
				//     sequence part's stateTick to match. Note that we minus one from
				//     the inputEvent's stateTick because it starts
				//     at 1, not 0.
				// Note: see inputType creation in parseSequenceData() to understand
				// the bitwise comparisons (hold, modulus hold, etc).
				if (
					spBindingsFound ||
					(((ib[j][4] & sp.inputType) && blacklist[j] === undefined) &&
						(!(sp.inputType & 8) && ib[j][6] >= sp.stateTick) ||
						((sp.inputType & 8) && ((ib[j][6] - 1) % sp.stateTick === 0))
					)
				) {
					
					// test whether each bind's device type, index, method and code can be
					// found in the current inputElement. If so, remember and go on to the
					// next test.
					m = spBindTranslated[k].length;
					while (m--) {
						if (ib[j][0] === spBindTranslated[k][m][0]   &&
						    ib[j][1] === spBindTranslated[k][m][1]   &&
						    ib[j][2] === spBindTranslated[k][m][2]   &&
						    ib[j][3] === spBindTranslated[k][m][3]   &&
						    // test the inputEvent's input value to see whether it's within
						    // the range the sequence part bind requires.
						    // todo: potential problem here. If this test runs for a
						    // 'release' sequence, it will never be accepted since we're
						    // testing whether the input value is between the range used
						    // for a 'press'. If we ever want a sequence that needs a full
						    // press then a half-release to trigger, then the fix below
						    // (testing the input type) will break it.
						    // todo: should sequence parts include an input value to resolve
						    // this problem? Alternatively, the bindingList could specify
						    // the ranges considered as 'pressed' and 'released', but that
						    // complicates analog axes since we want 'release' events to
						    // fire as a stick is pulled back or somesuch. Right now the fix
						    // just avoids the range test if the input type is 'release'.
						    ((sp.inputType !== 2) ?
						    	(spBindTranslated[k][m][4][0] < spBindTranslated[k][m][4][1]) ?
						    		ib[j][5] >= spBindTranslated[k][m][4] && ib[j][5] <= spBindTranslated[k][m][4] :
						    		ib[j][5] >= spBindTranslated[k][m][5] && ib[j][5] <= spBindTranslated[k][m][5] :
						    	true)) {
						    // with thanks to http://indisnip.wordpress.com/2010/08/26/quicktip-check-if-a-number-is-between-two-numbers/
							bindMatched = true;
							break;
						}
					}

					// if the translated bind's elements match the inputEvent, then accept
					// the event.
					if (bindMatched) {
						// blacklist the inputEvent so another sequence part can't use it
						blacklist[j] = true;
						// move to the next bind in the sequence part
						k++;
						// reset j back to the last inputEvent element in this inputBuffer.
						j = iii;
						// remember that the tick tests above have already passed for this
						// sequence part.
						spBindingsFound++;
						bindMatched = false;
					}

					// If the binding array has more than one element (eg. ["x", "y"]) and
					// we haven't matched them all, skip to the next inputEvent and repeat.
					if (spBindingsFound !== spBindTranslatedLen) continue;

					// if we get here, this sequence part has been found in the
					// input (event type, stateTick, all bind names, etc). We can go on
					// to the next next sequence part.
					if (xlib.debug > 1 && sequence.parts.length === 1) xlib.log("Sequence: sequence " + sequence.name + " (single-part) part " + si + " matched!");
					if (xlib.debug > 0 && sequence.parts.length > 1) xlib.log("Sequence: sequence " + sequence.name + " (multi-part) part " + si + " matched!");
					// Reset how many bind names have been found
					spBindingsFound = 0;
					// reset j to the biggest inputEvent index so that we step through
					// the entire set of inputEvents for the next sequence part.
					j = iii;
					// if there's no more input to process, return a match.
					if (!si) return true;
					// move to the next sequence part
					si--;
					// Opt: if we're staying inside inner loop j then we need to update
					// some vars. If we're about to exit it then they'll be updated anyway
					// before we re-enter.
					if (j) {
						// update local var access
						sp = sequence.parts[si];
						spBindTranslated = [];
						spBindTranslatedLen = sp.bindNames.length;
						for (k = 0; k < spBindTranslatedLen; k++) {
							spBindTranslated[k] = [];
							l = bindingList[sp.bindNames[k]].length;
							while (l--) {
								spBindTranslated[k][l] = bindingList[sp.bindNames[k]][l];
							}
						}
						// reset k as it's used in the test below
						k = 0;
					}
				}
				else {
					if (xlib.debug > 2) xlib.log("skipped non-match in major test: sequence.parts[" + si + "]: " + sp.event + "," + spBindTranslated[k] + "," + sp.inputTicks + " ib[" + ibl + "][" + j + "]: " + ib[j]);
				}

				// loop around to the next inputEvent if there is one, otherwise to the
				// next inputBuffer.
			}

			// change first loop status if necessary
			if (firstLoop) firstLoop = false;
		}

		// if we get here then we ran out of ticks. Immediately return no match.
		if (xlib.debug > 2) xlib.log("ran out of ticks for sequence " + sequence.name + " match");
		return false;
	},
	// todo: all these parse* functions should return a new object instead of
	// storing it in xlib. Storing sequences is particularly daft since
	// they're not accessed by any other xlib code -- they're always passed
	// into functions from user code.
	parseSequenceData: function(name, sequenceData) {
		// local var access
		var sdi = sequenceData.length;
		var sequences = [];
		var len;
		var bindNames;
		// holds undecoded input strings split into an array
		var partData;
		// regex and capture array
		var partregex = /^([~\/%]{0,1})(\${0,1})([0-9]*)(_{0,1}[a-z])(_{0,1}[a-z]{0,1})(_{0,1}[a-z]{0,1})(_{0,1}[a-z]{0,1})(_{0,1}[a-z]{0,1})(_{0,1}[a-z]{0,1})$/i;
		// hack: todo: the disabled regex below works in Chrome and Opera but gives
		// different results in Firefox.
		//var partregex = /^([~\/]{0,1})(\${0,1})([0-9]*)(_{0,1}[a-z])(_{0,1}[a-z]{0,1}){0,5}$/i;
		var components;
		// counters
		var i = -1, j = -1, k;

		// label for escaping the inner loop and moving to the next sequence
		loop_sequence:
		// step through each sequence data element and reorganise its contents.
		while (++i < sdi) {
			// start building the new sequence
			len = sequences.length;
			sequences[len] = {
				name: sequenceData[i][0],
				ticks: sequenceData[i][1],
				parts: [],
				noBuffer: (sequenceData[i][3]) ? true : false
			};
			// get the raw part data text (eg. "F,~D,X") and split on commas.
			partData = sequenceData[i][2].split(",");
			var pi = partData.length;
			// step through each part and regex to death.
			j = -1;
			while (++j < pi) {
				// At a higher level, the game is responsible for reversing bindings when
				// a character turns left or right (forward may then map to 'leftarrow').

				// valid example parts:   /D   $F   ~B   DF   ~20B   /30D   ~25$DB
				// use regex to break the sequence apart.
				components = partData[j].match(partregex);
				// if components is null then the sequence was invalid.
				if (!components) {
					if (xlib.debug) xlib.log("Error:    parseSequenceData (regex) found invalid sequence for '" + sequenceData[i][0] + "'. Dropped sequence")
					// remove the half-built sequence from the array
					sequences.length = sequences.length - 1;
					continue loop_sequence;
				}
				// components will be a five-element array. Ignore the first.
				sequences[len].parts[j] = {
					// index 1 is input type ("~" release, "/" hold, "%" hold with ticksHeld modulus, "" press)
					inputType: (components[1] === "~") ? 2 : (components[1] === "/") ? 4 : (components[1] === "%") ? 12 : 1,
					// index 2 is whether to allow adjacent directions
					// todo: this doesn't do anything in matchSequences yet. It always
					// allows adjacent directions, even if this is set to false.
					allowAdjacentDirections: (components[2]) ? true : false,
					// index 3 is state tick (if blank, use 1)
					stateTick: (components[3]) ? parseInt(components[3]) : 1,
					// index 4 is the input mapping
					bindNames: []
				};
				// setting map requires a loop through the six last regex matches.
				bindNames = sequences[len].parts[j].bindNames;
				for (k = 4; k < 10; k++) {
					if (components[k]) bindNames.push(components[k]);
				}
			}
			if (xlib.debug) xlib.log("Sequence: group '" + name + "' added '" + sequences[len].name + "'");
			if (xlib.debug > 1) xlib.log(sequences[i]);
			// move to next sequence.
		}
		// store the new sequence list into the sequence object.
		this.sequences[name] = sequences;
		// return the new sequence list.
		return sequences;
	}
	
}

xlib.drawQueue = {
	// A drawList is an array containing a set of drawing instructions to be
	// performed. Element 0 contains the type of drawing operation, and the
	// meaning of elements 2 onward depend on its value.
	//
	// Detailed element breakdown:
	//
	//   0: type of operation (0 = image, 1 = rect, more to come)
	//   1: the z-order of the element. After the complete list is sorted the
	//      element with the largest z-order will be drawn on top.
	//
	// If element 0 is set to 0 (image), the elements after represent:
	//
	//	 2: a reference to an image source to source pixels from
	//   3: the source bounding box object
	//   4: destination x
	//   5: destination y
	//   6: destination w
	//   7: destination h
	//   8: globalAlpha used for the operation
	//
	// If element 0 is set to 1 (rect), the elements after represent:
	//
	//   2: stroke style
	//   3: fill style
	//   4: x
	//   5: y
	//   6: w
	//   7: h
	//
	// If element 0 is set to 2 (text), the elements after represent:
	//
	//   2: stroke style
	//   3: fill style
	//   4: x
	//   5: y
	//   6: font
	//   7: alignment
	//   8: baseline
	//   9: content
	//   
	_finalDrawListArray: [],
	// Blindly concatenates the drawList array with the existing finalDrawList.
	// Does absolutely no validation -- we're aiming for speed and the image
	// parsing loading code should have handled validation already.
	addDrawList: function(drawListArray) {
		// thanks to http://stackoverflow.com/questions/1374126/how-to-append-an-array-to-an-existing-javascript-array
		this._finalDrawListArray.push.apply(this._finalDrawListArray, drawListArray);
	},
	zSort: function (a, b) {
		// adapted from http://blog.vjeux.com/2010/javascript/javascript-sorting-table.html . Thanks!
		// we have three levels of testing here to avoid flicker in browsers with
		// non-stable sorting algorithms. In almost every case the first test will
		// fail and the test at the bottom of the function will decide the result.
		// Should there be two elements with the same z, we test for x, and in the
		// unlikely event that x is the same we test for y. We give up if y is
		// equal because extra processing isn't justified for such a corner case.
		// first level test: lower z gets priority
		if (a[1] === b[1]) {
			// second level test: lower x gets priority
			if (a[4] === b[4]) {
				// third level test: lower y gets priority
				if (a[5] === b[5]) return 0;
				return (a[5] < b[5]) ? -1 : 1;
			}
			return (a[4] < b[4]) ? -1 : 1;
		}
		return (a[1] < b[1]) ? -1 : 1;
	},
	// process the draw list and return bool
	draw: function(context) {
		// local var access
		var drawListArray = this._finalDrawListArray;
		var drawScaleX = xlib.drawScaleX;
		var drawScaleY = xlib.drawScaleY;
		// early exit if empty
		if (!drawListArray.length) return true;
		// sort the draw list. This uses a custom function to determine the order.
		// Note we're sorting these in ascending order (smallest depth to largest
		// depth) so we can use a reverse while next.
		// 20100608: Chrome's sort isn't stable -- identical (or identical to a
		// significant digit) numbers may be arbitrarily swapped in array order
		// during consecutive sorts. This leads to horrible character flicker
		// because the drawlist gets shuffled between draws. IE, FF and Webkit are stable.
		// The extended code below is a workaround that puts more burden on JS. See:
		// http://stackoverflow.com/questions/1969145/sorting-javascript-array-with-chrome
		// http://www.antipode.ca/2009/arraysort-browser-differences/
		// http://code.google.com/p/v8/issues/detail?id=324
		// eek, http://code.google.com/p/v8/issues/detail?id=90#c12
		// http://code.google.com/p/v8/issues/detail?id=103#makechanges
		/*
		final.sort(function (a, b) {
			return a[1] > b[1];
		});
		*/
		drawListArray.sort(this.zSort);
		// step through the draw list.
		var i = drawListArray.length;
		var listItem;
		while (i--) {
			listItem = drawListArray[i];
			
			// draw
			switch (listItem[0]) {
				
				case 0: // image
					/*
					// note that all the array indexes here are wrong and need to be updated.
					if (xlib.debug) {
						if (!listItem[0]) {
							xlib.log("Error:    drawQueue.draw(): image source missing");
							return false;
						}
						if (isNaN(listItem[3].x) ||
						    isNaN(listItem[3].y) ||
						    isNaN(listItem[3].w) ||
						    isNaN(listItem[3].h)) {
							xlib.log("Error:    drawQueue.draw() given undefined or NaN values for listItem[3]. Object:");
							xlib.log(listItem[3]);
							return false;
						}
						if (listItem[3].x < 0 ||
						    listItem[3].y < 0 ||
						    listItem[3].w < 0 ||
						    listItem[3].h < 0 ||
						    listItem[3].x + listItem[3].w > listItem[0].width ||
						    listItem[3].y + listItem[3].h > listItem[0].height) {
							xlib.log("Error:    drawQueue.draw() given invalid source coordinates (less than 0 or outside bounds) for listItem[3]. Object:");
							xlib.log(listItem[3]);
							return false;
						}
						if (isNaN(listItem[5].w) || listItem[5].w <= 0 ||
						    isNaN(listItem[5].h) || listItem[5].h <= 0) {
							xlib.log("Error:    drawQueue.draw() given undefined, NaN or invalid dest coordinates for listItem[5]. Object:");
							xlib.log(listItem[5]);
							return false;
						}
						if (!context) {
							xlib.log("Error:    drawQueue.draw() missing context");
							return false;
						}
						// it'd be nice to get a decent error message from the browser
						// if coordinates are wrong. Please?
					}
					*/
					context.globalAlpha = listItem[8];
					// disables the bilinear/bicubic filtering that moz performs by default
					// when scaling an image passed to drawImage(). Note that at 2011 02 08
					// there's no equivalent for other browsers. This has been disabled while
					// we wait for better support.
					// https://developer.mozilla.org/en/Canvas_tutorial/Using_images#section_13
					// context.mozImageSmoothingEnabled = false;
					context.drawImage(
						listItem[2],
						listItem[3].x,
						listItem[3].y,
						listItem[3].w,
						listItem[3].h,
						listItem[4] * drawScaleX,
						listItem[5] * drawScaleY,
						listItem[6] * drawScaleX,
						listItem[7] * drawScaleY
					);
					break;
					
				case 1: // rect
					context.globalAlpha = 1;
					// if a fill style has been provided, use it
					if (listItem[3]) {
						context.fillStyle = listItem[3];
						context.fillRect(
							listItem[4] * drawScaleX, 
							listItem[5] * drawScaleY, 
							listItem[6] * drawScaleX, 
							listItem[7] * drawScaleY
						);
					}
					// if a stroke style has been provided, use it
					if (listItem[2]) {
						context.strokeStyle = listItem[2];
						context.strokeRect(
							listItem[4] * drawScaleX, 
							listItem[5] * drawScaleY, 
							listItem[6] * drawScaleX, 
							listItem[7] * drawScaleY  
						);
					}
					break;
					
				case 2: // text
					context.globalAlpha = 1;
					// todo: should text scale like other graphics options?
					if (listItem[6]) context.font = listItem[6];
					if (listItem[7]) context.textAlign = listItem[7];
					if (listItem[8]) context.textBaseline = listItem[8];
					// if there's content
					if (listItem[9]) {
						// if a fill style has been provided, use it
						if (listItem[3]) {
							context.fillStyle = listItem[3];
							context.fillText(
								listItem[9],
								listItem[4],
								listItem[5]
							)
						}
						// if a stroke style has been provided, use it
						if (listItem[2]) {
							context.strokeStyle = listItem[2];
							context.strokeText(
								listItem[9],
								listItem[4],
								listItem[5]
							)
						}
					}
					break;

			}
		}
		
		// clear the final draw list
		drawListArray.length = 0;
		// todo: return a useful value here
		return true;
	}
};

// a simple, instantiable text console that draws to a context. When adding a
// new line, a name can be provided, allowing you to update that line by name
// later.
xlib.textConsole = function() {
	this._output = [];
	// todo: use get/set for these
	this.context = null;
	this.visible = true;
	this.x = 10;
	this.y = 6;
	this.maxLength = 12;
};
xlib.textConsole.prototype.namedLineExists = function(name) {
	var
		i = 0,
		len = this._output.length;
	for (i = 0; i < len; i++) {
		if (this._output[i][1] === name) {
			return true;
		}
	}
	return false;
};
xlib.textConsole.prototype.addLine = function(str, name) {
	this._output.push([str, name]);
	// trim array
	this._output = this._output.splice(-this.maxLength);
};
xlib.textConsole.prototype.updateLine = function(str, name) {
	// find the named array element and update it. If it doesn't exist then
	// return false.
	var
		i = 0,
		len = this._output.length;
	for (i = 0; i < len; i++) {
		if (this._output[i][1] === name) {
			this._output[i][0] = str;
			return true;
		}
	}
	return false;
};
xlib.textConsole.prototype.draw = function(x, y) {
	if (!this.visible) return true;
	var
		i = 0,
		j = 0,
		len = this._output.length,
		strings = this._output,
		context = this.context;
	// allow overriding position from params.
	if (x === undefined) x = this.x;
	if (y === undefined) y = this.y;
	context.fillStyle = "white";
	//context.font = "8px '04b03Regular'";
	context.font = "11px 'Consolas', 'Courier New', 'Courier'";
	i = strings.length - 1 - 8;
	if (i < 0) i = 0;
	for (i; i < len; i++) {
		context.fillText(strings[i][0], x, y + ((j + 1) * 14));
		j++;
	}
};

})();