// The original author of this code is Andrew Stibbard at http://xhva.net
// (xhva.net@gmail.com), copyright 2011 except where noted.
// You are hereby granted a licence to copy, extend and produce derivative
// works based upon this code for non-commercial purposes as long as this
// notice is reproduced in plain sight inside the derivative file or project.
// For commercial use please contact Andrew at the above address.

// Questions? Improvements? Contact me: http://xhva.net/work or xhva.net@gmail.com .
// Cheers!

(function(){

var
	window = this,
	undefined,

	// todo: rename this horrible global var
	xsor = window.xsor = {

		// canvas tag in the page.
		canvas: null,
		context: null,
		viewportWidth: 0,
		viewportHeight: 0,
		// used for boundary setting like w and h above
		depth: 0,

		// enables/disables physics, drawing and input processing each tick
		pause: false,

		particleCount: 0,

		// Wave system settings
		waveSystem: {
			enabled: true,
			currentWave: 1,
			currentSection: 1,
			enemiesPerWave: 4,
			enemiesAlive: 0,
			enemiesSpawned: 0,
			waveComplete: false,
			sectionComplete: false,
			wavesPerSection: 3,
			totalSections: 4,
			goArrowVisible: false,
			canProgress: false
		},

		// maintain this number of actor instances on screen by spawning a new
		// instance when one disappears
		minimumActorInstances: 4,

		fps: 60,
		
		playerHitPoints: 600,

		init: function(canvas) {

			// temp: if there's a particleCount param in the url, use it
			var temp = document.location.href.lastIndexOf("?");
			if (temp > -1) {
				temp = document.location.href.substr(temp);
				if (temp) temp = temp.substr(1);
				if (temp) temp = temp.split("=");
				if (temp[1]) temp = parseInt(temp[1]);
				if (temp >= 0) xsor.minimumActorInstances = Math.floor(temp);
			}

			// local var access
			var xlib = window.xlib;
			if (!canvas || canvas.tagName.toLowerCase() !== 'canvas') {
				xlib.log("Invalid canvas id provided to xsor.init(). Cannot continue.");
				return false;
			}

			// store canvas reference, create context and store dimensions
			this.canvas = canvas;
			this.context = this.canvas.getContext('2d');
			this.viewportWidth = this.canvas.width;
			this.viewportHeight = this.canvas.height;
			// todo: adjust this to around 64 when we have a way to stop characters
			// from walking on top of walls
			this.depth = 64;

			// set up onclick handler on the canvas for pause
			canvas.onmousedown = function() {
				xsor.pause = (xsor.pause === false) ? true : false;
			};

			// create text console for loading messages
			this.textConsole = new xlib.textConsole;
			this.textConsole.context = this.context;

			// set up the callback functions for when an image or audio file loads
			xlib.imageStore.onLoadComplete = xsor.loadWait;
			xlib.audioStore.onLoadComplete = xsor.loadWait;

			// parse and load image data
			this.textConsole.addLine("Parsing image data: ...", "imagedata");
			this.drawLoadingScreen();
			if (!this.initImages()) {
				xlib.log("Error:    xsor.initImages() failed.");
				this.textConsole.addLine("Parsing image data: ... error. See console for more information.", "imagedata");
				this.drawLoadingScreen();
				return false;
			}
			this.textConsole.updateLine("Parsing image data: ... done", "imagedata");
			this.drawLoadingScreen();

			// audio
			this.textConsole.addLine("Parsing audio data: ...", "audiodata");
			this.drawLoadingScreen();
			if (!this.initAudio()) {
				xlib.log("Error:    xsor.initAudio() failed.");
				this.textConsole.updateLine("Parsing audio data: ... error. See console for more information.", "audiodata");
				this.drawLoadingScreen();
				return false;				
			}
			this.textConsole.updateLine("Parsing audio data: ... done", "audiodata");
			this.drawLoadingScreen();

			// input
			this.textConsole.addLine("Initialising input: ...", "input");
			this.drawLoadingScreen();
			this.initInput();
			this.textConsole.updateLine("Initialising input: ... done", "input");
			this.drawLoadingScreen();

			// the -500 here sets a high y bound so particles don't bounce off a visible ceiling
			xlib.physicsStore.addGroup("characters", new xlib.boundingBox3D(5, -500, 0, xsor.viewportWidth + 5 - 5, xsor.viewportHeight + 500 - 5, xsor.depth));
			var polyBoundary = new xlib.polygonBoundary(xsor.resourceData.stage_collision.sor2_alley);
			// set the polygon boundary for the x,z axes, and provide a callback func
			// that will allow us to provide transformed positions that used when
			// comparing the polygon to the instance's position. In this case we're
			// applying the same pseudo-3D effect as we see on screen.
			xlib.physicsStore.groups.characters.set2DPolygonBoundary(polyBoundary, "xz");

			return true;
		},

		loadWait: function(obj) {
			var xlib = window.xlib;
			// log resource loading progress to the canvas
			var imComplete = xlib.imageStore.loadsComplete;
			var imCount = xlib.imageStore.imageCount;
			var auComplete = xlib.audioStore.loadsComplete;
			var auCount = xlib.audioStore.audioSampleCount;
			// images
			if (!xsor.textConsole.namedLineExists("images")) {
				xsor.textConsole.addLine("Loading images: " + imComplete + "/" + imCount + "...", "images");
			}
			if (obj instanceof xlib.imageStore.image) {
				xsor.textConsole.updateLine("Loading images: " + imComplete + "/" + imCount + "..." + ((imComplete === imCount) ? " done" : ""), "images");
			}
			// audio
			if (!xsor.textConsole.namedLineExists("audio")) {
				xsor.textConsole.addLine("Loading audio:  " + auComplete + "/" + auCount + "...", "audio");
			}
			if (obj instanceof xlib.audioStore.audioSample) {
				xsor.textConsole.updateLine("Loading audio:  " + auComplete + "/" + auCount + "..." + ((auComplete === auCount) ? " done" : ""), "audio");
			}
			// update the screen with the new progress
			xsor.drawLoadingScreen();
			// if there's no more images or audio to load, run the next step of init.
			if (xlib.imageStore.loadsPending === 0 && xlib.audioStore.loadsPending === 0) {
				window.xsor._init2();
			}
		},

		drawLoadingScreen: function() {
			// todo: more detail
			// for now, just clear the screen and draw the text console.
			xsor.context.fillStyle = "black";
			xsor.context.fillRect(0, 0, xsor.viewportWidth, xsor.viewportHeight);
			xsor.textConsole.draw();
		},

		_init2: function() {
			// called when the image and audio files have finished loading.
			// local var access
			var xlib = window.xlib;
			var r;
			var actor;
			var actorStore = window.xlib.actorStore;

			/*
			// debug: draw all images to the page
			var p;
			for (p in xlib.imageStore.images) {
				if (xlib.imageStore.images.hasOwnProperty(p) && xlib.imageStore.images[p].source) {
					document.body.appendChild(xlib.imageStore.images[p].source);
				}
			}
			*/


			// init animation stuff
			this.textConsole.addLine("Parsing animation data: ...", "animdata");
			this.drawLoadingScreen();
			if (!this.initAnimations()) {
				xlib.log("Error:    xsor.initAnimations() failed.");
				this.textConsole.updateLine("Parsing animation data: ... error. See console for more information.", "animdata");
				this.drawLoadingScreen();
				return false;
			}
			this.textConsole.updateLine("Parsing animation data: ... done", "animdata");
			this.drawLoadingScreen();


			// init particle stuff
			this.textConsole.addLine("Creating particles: ...", "particles");
			this.drawLoadingScreen();
			if (!xsor.initParticles(xsor.particleCount)) {
				xlib.log("Error:    xsor.initParticles() failed.");
				this.textConsole.updateLine("Creating particles: ... error. See console for more information", "particles");
				this.drawLoadingScreen();
				return false;
			}
			this.textConsole.updateLine("Creating particles: ... done", "particles");
			this.drawLoadingScreen();


			// set how many ticks we want to "buffer" actions for.
			actorStore.setActionBufferLength(9);

			// set useful actorConstants defaults
			xlib.actorStore.defaultActorConstants = {
				hitPoints             : 250,
				width                 : 10,
				height                : 10,
				depth                 : 10,
				directionsAllowed     : xlib.INSTANCEDIRECTION_LEFT | xlib.INSTANCEDIRECTION_RIGHT,
				moveSpeedX            : 75, // 67.5,
				moveSpeedY            : 50, // 45,
				moveSpeedZ            : 50, // 45,
				jumpSpeedX            : 94.5,
				jumpSpeedY            : 292.5, // todo: hack: temp: vely depends on the dodgy gravity I have set
				jumpSpeedZ            : 0,
				knockoutSpeedX        : 135,
				knockoutSpeedY        : -315,
				knockoutSpeedZ        : 0,
				hitPause              : 5,
				getHitPause           : 30, // 12 for "player" chars in sor2, 30 for npcs
				getHitFallPause       : 6,
				restTicks             : 24,
				audioHitGround        : "hit_ground",
				audioGetHitLight      : "get_hit_light1",
				audioGetHitStrong     : "get_hit_strong1",
				audioGetHitFierce     : "get_hit_fierce1",
				audioGetHitKnockdown  : "get_hit_knockdown1",
				audioGetHitWeaponBlunt: "get_hit_weapon_blunt",
				audioGetHitWeaponSlash: "get_hit_weapon_slash",
				audioGetHitWeaponStab : "get_hit_weapon_stab",
				audioGetHitStrong2    : "get_hit_strong2",
				audioGetHitKnockdown2 : "get_hit_knockdown2",
				audioKnockout         : "knockout1",
				animIdle              : null,
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
				animsHitsparks        : ["hitspark_light", "hitspark_strong", "hitspark_fierce"]
			}


			this.textConsole.addLine("Initialising actors: ...", "actors");
			this.drawLoadingScreen();
			if (!xsor.initActors()) {
				xlib.log("Error:    xsor.initActors() failed.");
				this.textConsole.updateLine("Initialising actors: ... error. See console for more information.", "actors");
				this.drawLoadingScreen();
				return false;
			}
			this.textConsole.updateLine("Initialising actors: ... done", "actors");
			this.drawLoadingScreen();


			this.textConsole.addLine("Initialising instances: ...", "instances");
			this.drawLoadingScreen();
			if (!xsor.initActorInstances()) {
				xlib.log("Error:    xsor.initActorInstances() failed.");
				this.textConsole.updateLine("Initialising instances: ... error. See console for more information.", "instances");
				this.drawLoadingScreen();
				return false;
			}
			this.textConsole.updateLine("Initialising instances: ... done", "instances");
			this.drawLoadingScreen();


			this.textConsole.addLine("Initialising players: ...", "players");
			this.drawLoadingScreen();
			if (!xsor.initPlayers()) {
				xlib.log("Error:    xsor.initPlayers() failed.");
				this.textConsole.updateLine("Initialising players: ... error. See console for more information.", "players");
				this.drawLoadingScreen();
				return false;
			}
			this.textConsole.updateLine("Initialising players: ... done", "players");
			this.drawLoadingScreen();

			// Reset wave system for new game
			this.waveSystem.currentWave = 1;
			this.waveSystem.currentSection = 1;
			this.waveSystem.enemiesSpawned = 0;
			this.waveSystem.enemiesAlive = 0;
			this.waveSystem.waveComplete = false;
			this.waveSystem.sectionComplete = false;
			this.waveSystem.goArrowVisible = false;
			this.waveSystem.canProgress = false;
			this.hideGoArrow();
			console.log('Wave system reset:', this.waveSystem);

			// hide the text console
			xsor.textConsole.visible = false;

			self = this;
			// use the new spunky request anim frame stuff if available
			if (window.requestAnimFrame) {
				window.requestAnimFrame(
					function() {
						self.mainloop();
					},
					xsor.canvas
				);
			}
			// otherwise fall back to the original setInterval
			else {
				window.setInterval(
					function() {
						self.mainloop();
					},
					1000 / self.fps
				);
			}

			return true;
		},

		initImages: function() {
			var r = xlib.imageStore.parseImageData(xsor.resourceData.images);
			return (r === xsor.resourceData.images.length) ? true : false;
		},

		initAnimations: function() {
			// animations and collision data
				//  [
				//    anim name,
				//    [
				//      image name,
				//      image frame id || image frame name || image frame object,
				//      tick length,
				//      [
				//        [bodybox1x, bodybox1y, bodybox1w, bodybox1h],
				//        [bodybox2x, ...]
				//      ],
				//      [
				//        [hitbox1x, hitbox1y, hitbox1w, hitbox1h],
				//        [hitbox2x, ...]
				//      ]
				//    ],
				//    ...
				//  ]

			// todo: item pickup anim for all chars (typically getup2,10)
			// todo: allow for non-looping and partial looping anims
			
			// todo: random notes from old animation data:
			//   - char_axel_dragon_wing: give this bodyBoxes once notHitBy exists
			//   - char_axel_knee: last frame with huge tick val is to stop the anim
			//     from ending and allowing another knee in the same fall
			//   - char_axel_fall: restore bodyBox later to enable juggling
			//   - char_axel_rest: restore bodyBox later for otg attacks
			//   - shiva is from sor3. anims have been padded with idle frames to roughly
			//     match sor2 speeds.
			//   - implement run anims for the sor2 playable char sprites.
			//   - see old xsor2 initAnimations() for comments on frame adjustments
			//     such as adding frames that weren't present in the original game
			//     (eg. char_shiva_sor3_punch idle1) or adding ticks to frames so
			//     that a character isn't too fast compared to others
			//     (eg. char_shiva_sor3_punch punch1).
			//   - npc_raven: create backwards hop
			//   - npc_signal: create backwards hop

			// parseAnimData returns the number of animations successfully added
			var r = xlib.animStore.parseAnimData(xsor.resourceData.animations);
			return (r === xsor.resourceData.animations.length) ? true : false;
		},

		initAudio: function() {
			// todo: would be nice to have all these in one file and split them into
			// separate audio samples on load
			// note: be aware of format-specific browser bugs listed in xlib's audioStore
			// todo: audio groups

			// todo: temp: hack: temporarily trim number of audio samples to 26 to
			// avoid audio loading bug in Firefox 11.0a1 gamepad nightly
			if (navigator.userAgent.match(/Gecko\/20111212 Firefox\/11\.0a1/i)) {
				var i = 0;
				for (var p in xsor.resourceData.audio) {
					i++;
					if (i > 26) delete xsor.resourceData.audio[p];
				}
			}
			
			return xlib.audioStore.parseAudioData(xsor.resourceData.audio);
		},

		initInput: function() {
			// local var access
			var kt = xlib.inputStore.keyboard.keyTable;

			xlib.inputStore.init();
			xlib.inputStore.keyboard.init(window, [kt.tab, kt.f5, kt.f6, kt.f11, kt.f12, kt.t]);
			xlib.inputStore.gamepads.init();

			return true;
		},

		initActors: function() {
			var
				is = xlib.inputStore,
				as = xlib.actorStore,
				rd = xsor.resourceData,
				sequenceList,
				actor,
				p;
				
			for (p in rd.actors) {
				if (!rd.actors.hasOwnProperty(p)) continue;
				// must contain three properties. Sequences and actorConstants may be
				// empty but must be present.
				if (!rd.actors[p].stateMachine || !rd.actors[p].actorConstants || !rd.actors[p].sequenceData) {
					xlib.log("Error:    xsor.initActors() found actor '" + p + "' missing stateMachine, sequenceData or actorConstants.");
					return false;
				}
				// todo: nuke p once we stop parse* functions from storing in xlib
				sequenceList = is.parseSequenceData(p, rd.actors[p].sequenceData);
				if (!sequenceList) {
					xlib.log("Error:    xsor.initActors() couldn't create sequence list for actor '" + p + "'.");
					return false;
				}
				actor = as.addActor(
					p,
					rd.actors[p].stateMachine,
					rd.actors[p].actorConstants,
					sequenceList
				);
				if (!actor) {
					xlib.log("Error:    xsor.initActor() couldn't add actor '" + p + "'.");
					return false;
				}
			}
			return true;
		},

		initActorInstances: function() {
			var physicsObject, actor, actorInstance;
			var playerCount = (window.gameSettings && window.gameSettings.playerCount) || 3;

			// axel1 (always created - Player 1)
			actor = xlib.actorStore.actors.axel;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				20, 235, .02,   // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("axel1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_RIGHT;

			// rbear1 (Player 3)
			if (playerCount >= 3) {
			actor = xlib.actorStore.actors.rbear;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				460, 235, .02,   // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("rbear1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;
			} // end if playerCount >= 3

			// shiva1 (Player 2)
			if (playerCount >= 2) {
			actor = xlib.actorStore.actors.shiva_sor3
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				235, 235, 40,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("shiva1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;
			} // end if playerCount >= 2

			// Skip initial enemies if wave system is enabled (they'll be spawned by wave system)
			if (!this.waveSystem.enabled) {
			// donovan1
			actor = xlib.actorStore.actors.donovan;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				160, 235, 10,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("donovan1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_RIGHT;

			// galsia1
			actor = xlib.actorStore.actors.galsia;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				400, 235, 10,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("galsia1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;

			// hakuyo1
			actor = xlib.actorStore.actors.hakuyo;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				100, 235, 40,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("hakuyo1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_RIGHT;

			// raven1
			actor = xlib.actorStore.actors.raven;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				350, 235, 28,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("raven1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;

			// signal1
			actor = xlib.actorStore.actors.signal;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				300, 235, .02,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("signal1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_RIGHT;
			} // end if !waveSystem.enabled (skip initial enemies)

			/*
			// thug1
			actor = xlib.actorStore.actors.thug;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				390, 235, 2,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("thug1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;
			*/

			// barrel1
			actor = xlib.actorStore.actors.object_barrel;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				250, 235, 0.2,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("barrel1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;
			
			// trashcan1
			actor = xlib.actorStore.actors.object_trashcan;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				290, 235, 50,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("trashcan1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;

			// trashcan2
			actor = xlib.actorStore.actors.object_trashcan;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				320, 235, 50,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("trashcan2", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;
			actorInstance.userVars.dropItem = "item_chicken";
			
			// parkbin1
			actor = xlib.actorStore.actors.object_parkbin;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				180, 235, 50,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("parkbin1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;
			
			// arcademachine1
			actor = xlib.actorStore.actors.object_arcademachine;
			// create and store physics
			physicsObject = new xlib.physicsStore.physicsObject(
				400, 235, 41,  // x, y, z
				actor.actorConstants.width, actor.actorConstants.height, actor.actorConstants.depth,    // w, h, d
				0, 0, 0,      // vx, vy, vz
				0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
				7             // useAxes is a bitwise value
			);
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// create actor instance
			actorInstance = actor.createInstance("arcademachine1", physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			actorInstance.axisFlip = xlib.INSTANCEDIRECTION_LEFT;

			return true;
		},

		playerEventHit: function(hitInfo) {
			var i = hitInfo.receivingInstance;
			switch (i.actor.name) {
				case "axel":
					this.userVars.score += (i.hitPoints > 0 ? 10 : 100);
					break;
				case "shiva_sor3":
					this.userVars.score += (i.hitPoints > 0 ? 10 : 100);
					break;
				case "object_barrel":
				case "object_parkbin":
				case "object_trashcan":
				case "object_arcademachine":
					this.userVars.score += (i.hitPoints > 0 ? 5 : 50);
					break;
				default:
					this.userVars.score += (i.hitPoints > 0 ? 5 : 25);
					break;
			}
		},

		initPlayers: function() {
			var is = xlib.inputStore;
			var kt = is.keyboard.keyTable;
			var playerStore = xlib.playerStore;
			var bindingList, player;
			var actorInstances = xlib.actorStore.instances;
			var playerCount = (window.gameSettings && window.gameSettings.playerCount) || 3;

			// player 1 (always created)
			// create the player bindings - WASD movement, JKL attacks
			var bindingList = {
				x:  [ "j"    ,  "gamepad_0_button_0"],  // Special
				y:  [ "k"    ,  "gamepad_0_button_3"],  // Punch
				z:  [ "l"    ,  "gamepad_0_button_2"],  // Jump
				a:  [ "u"    ,  "gamepad_0_button_1"],
				b:  [ "i"    ,  "gamepad_0_button_2"],
				c:  [ "o"    ,  "gamepad_0_button_7"],
				s:  [ "tilde",  "gamepad_0_button_8"],
				B:  [ "a"    ,  ["gamepad_0_axis_0", -.95, -1] ],  // Left
				F:  [ "d"    ,  ["gamepad_0_axis_0",  .95,  1] ],  // Right
				U:  [ "w"    ,  ["gamepad_0_axis_1", -.95, -1] ],  // Up
				D:  [ "s"    ,  ["gamepad_0_axis_1",  .95,  1] ],  // Down
				_L: [ "a"    ,  ["gamepad_0_axis_0", -.95, -1] ],
				_R: [ "d"    ,  ["gamepad_0_axis_0",  .95,  1] ],
				_U: [ "w"    ,  ["gamepad_0_axis_1", -.95, -1] ],
				_D: [ "s"    ,  ["gamepad_0_axis_1",  .95,  1] ]
			};
			bindingList = xlib.inputStore.convertSimplebindingList(bindingList);
			if (!bindingList) {
				xlib.log("Error:    invalid bindingList for player 'Axel'.");
				return false;
			}
			// create the player and take control of the instance
			var player = playerStore.addPlayer("Axel", bindingList);
			if (Object.isEmpty(player)) {
				xlib.log("Error:    xsor.initPlayers() couldn't create player.");
				return false;
			}
			// add custom scoring var
			player.userVars.score = 0;
			// grab control of the an instance
			xsor.controlInstance(player.name, actorInstances.axel1.name);

			// player 2
			if (playerCount >= 2) {
			var bindingList = {
				x:  [ "eight",        "gamepad_1_button_0"],
				y:  [ "nine",         "gamepad_1_button_3"],
				z:  [ "zero",         "gamepad_1_button_2"],
				a:  [ "i",            "gamepad_1_button_1"],
				b:  [ "o",            "gamepad_1_button_2"],
				c:  [ "p",            "gamepad_1_button_7"],
				s:  [ "seven",        "gamepad_1_button_8"],
				B:  [ "comma",        ["gamepad_1_axis_0", -.95, -1] ],
				F:  [ "forwardslash", ["gamepad_1_axis_0",  .95,  1] ],
				U:  [ "l",            ["gamepad_1_axis_1", -.95, -1] ],
				D:  [ "period",       ["gamepad_1_axis_1",  .95,  1] ],
				_L: [ "comma",        ["gamepad_1_axis_0", -.95, -1] ],
				_R: [ "forwardslash", ["gamepad_1_axis_0",  .95,  1] ],
				_U: [ "l",            ["gamepad_1_axis_1", -.95, -1] ],
				_D: [ "period",       ["gamepad_1_axis_1",  .95,  1] ]
			};
			bindingList = xlib.inputStore.convertSimplebindingList(bindingList);
			if (!bindingList) {
				xlib.log("Error:    invalid bindingList for player 'Shiva'.");
				return false;
			}
			// create the player and take control of the instance
			var player = playerStore.addPlayer("Shiva", bindingList);
			if (Object.isEmpty(player)) {
				xlib.log("Error:    xsor.initPlayers() couldn't create player.");
				return false;
			}
			// add custom scoring var
			player.userVars.score = 0;
			// grab control of the an instance
			xsor.controlInstance(player.name, actorInstances.shiva1.name);
			} // end if playerCount >= 2

			// player 3
			if (playerCount >= 3) {
			var bindingList = {
				x:  [ "ins",      "gamepad_2_button_0"],
				y:  [ "home",     "gamepad_2_button_3"],
				z:  [ "pageup",   "gamepad_2_button_2"],
				a:  [ "del",      "gamepad_2_button_1"],
				b:  [ "end",      "gamepad_2_button_2"],
				c:  [ "pagedown", "gamepad_2_button_7"],
				s:  [ "numpad7",  "gamepad_2_button_8"],
				B:  [ "numpad1",  ["gamepad_2_axis_0", -.95, -1] ],
				F:  [ "numpad3",  ["gamepad_2_axis_0",  .95,  1] ],
				U:  [ "numpad5",  ["gamepad_2_axis_1", -.95, -1] ],
				D:  [ "numpad2",  ["gamepad_2_axis_1",  .95,  1] ],
				_L: [ "numpad1",  ["gamepad_2_axis_0", -.95, -1] ],
				_R: [ "numpad3",  ["gamepad_2_axis_0",  .95,  1] ],
				_U: [ "numpad5",  ["gamepad_2_axis_1", -.95, -1] ],
				_D: [ "numpad2",  ["gamepad_2_axis_1",  .95,  1] ]

			};
			bindingList = xlib.inputStore.convertSimplebindingList(bindingList);
			if (!bindingList) {
				xlib.log("Error:    invalid bindingList for player 'RBear'.");
				return false;
			}
			// create the player and take control of the instance
			var player = playerStore.addPlayer("R. Bear", bindingList);
			if (Object.isEmpty(player)) {
				xlib.log("Error:    xsor.initPlayers() couldn't create player.");
				return false;
			}
			// add custom scoring var
			player.userVars.score = 0;
			// grab control of the an instance
			xsor.controlInstance(player.name, actorInstances.rbear1.name);
			} // end if playerCount >= 3

			return true;
		},

		// Wave system functions
		showGoArrow: function() {
			var ws = xsor.waveSystem;
			ws.goArrowVisible = true;
			if (window.showGoArrowUI) {
				window.showGoArrowUI();
			}
		},

		hideGoArrow: function() {
			var ws = xsor.waveSystem;
			ws.goArrowVisible = false;
			if (window.hideGoArrowUI) {
				window.hideGoArrowUI();
			}
		},

		updateWaveHUD: function() {
			var ws = xsor.waveSystem;
			if (window.updateGameHUD) {
				window.updateGameHUD(ws.currentSection, ws.currentWave, ws.enemiesAlive);
			}
		},

		nextWave: function() {
			var ws = xsor.waveSystem;
			console.log('nextWave called, canProgress:', ws.canProgress);
			if (!ws.canProgress) return;

			ws.currentWave++;
			ws.enemiesSpawned = 0;
			ws.waveComplete = false;
			ws.canProgress = false;
			xsor.hideGoArrow();

			console.log('Moving to wave', ws.currentWave, 'of section', ws.currentSection);

			// Check if section complete
			if (ws.currentWave > ws.wavesPerSection) {
				xsor.nextSection();
			} else {
				if (window.showWaveBanner) {
					window.showWaveBanner('WAVE ' + ws.currentWave);
				}
			}
		},

		nextSection: function() {
			var ws = xsor.waveSystem;
			ws.currentSection++;
			ws.currentWave = 1;
			ws.enemiesSpawned = 0;
			ws.waveComplete = false;
			ws.canProgress = false;

			if (ws.currentSection > ws.totalSections) {
				// Game complete!
				if (window.showVictory) {
					window.showVictory();
				}
				ws.enabled = false;
				return;
			}

			// Change stage visuals
			if (window.changeStage) {
				window.changeStage(ws.currentSection);
			}

			if (window.showWaveBanner) {
				window.showWaveBanner('STAGE ' + ws.currentSection);
			}
		},

		initParticles: function(particleCount) {
			// todo: strip out the imageStore and animStore dependencies
			// todo: die if boundingBox isn't set, and return a useful error

			// early exit
			if (particleCount < 1) return true;

			// local var access
			var xlib = window.xlib;
			var imageStore = xlib.imageStore;
			var animStore = xlib.animStore;
			var physicsStore = xlib.physicsStore;

			var particleBounds = physicsStore.groups.characters.getBoundingBox();
			var particle;
			// holds the random physicsObject properties
			var props;

	 		// array of possible animations for particles
	 		// todo: these anims are gone
	 		var particleAnims = [
			                     animStore.anims.char_barbon_idle,
			                     animStore.anims.char_donovan_idle,
			                     animStore.anims.char_falcon_idle,
			                     animStore.anims.char_galsia_idle,
			                     animStore.anims.char_galvice_idle,
			                     animStore.anims.char_hakuyo_idle,
			                     animStore.anims.char_ninjax_idle,
			                     animStore.anims.char_rbear_idle,
			                     animStore.anims.char_shiva_idle,
			                     animStore.anims.char_slum_idle,
			                     animStore.anims.char_storm_idle,
			                     animStore.anims.char_tiger_idle,
			                     animStore.anims.char_vice_idle,
			                     animStore.anims.char_ysignal_idle,
			                     animStore.anims.char_zamza_idle
			                    ];

			var particleAnimsLength = particleAnims.length;

			// stores the chosen particle anim for one iteration of the loop
			var particleAnim;
			var particleAnimImageFrameRect;
			var particleAnimInstance;
			var tickOffset;

			particleCount = particleCount;
			while (particleCount--) {
				// choose a random animation for the particle. The initial
				// frame's width and height will be used for the particle's w and h.
				particleAnim = particleAnims[Math.floor(Math.random() * particleAnimsLength)];
				// get the width and height of the first frame of the animation
				particleAnimImageFrameRect = particleAnim.frames[0].imageFrameRect;
				// generate a random msOffset for the animation start. This keeps
				// everyone animating at a slightly different time.
				tickOffset = Math.floor(Math.random() * 300);
				// start the animation and store the animInstance. This will be used
				// later when we draw the particle.
				particleAnimInstance = particleAnim.createAnimInstance(tickOffset);

				// create the physics object
				props = physicsStore.generatePhysicsPropertiesWithinRange(
					[particleBounds.x, particleBounds.w], // x
					[235, 235], // y
					[particleBounds.z, particleBounds.d], // z
					[particleAnimImageFrameRect.w, particleAnimImageFrameRect.w], // w
					[particleAnimImageFrameRect.h, particleAnimImageFrameRect.h], // h
					[0, xsor.depth], // d
					[-225, 225], // vx
					[-255, 225], // vy
					[0, 0], // vz
					[0, 1], // mass
					[.3, 1.2], // drag coefficient
					[0, 1] // restitution
				);

				// add the extra particle arguments to the end of the array, then create
				// a new particle with the generated physics properties.
				// additional particle params: colour, opacity, animInstance, tickLifetime, afterUpdateFunc, destroyFunc
				props.push(
					xlib.getRandomHexColour(),
					1,
					particleAnimInstance,
					null,
					undefined,
					undefined
				);
				// can't use apply when constructing a new object. This is ugly.
				// todo: get around this by forcing any constructor function to return
				// an instantiated object regardless of whether it was called with new.
				// An attempt was made at this but it's difficult to determine when
				// new was used when the function is inside an object.
				// todo: call()?
				particle = new physicsStore.physicsParticle(
					props[0],
					props[1],
					props[2],
					props[3],
					props[4],
					props[5],
					props[6],
					props[7],
					props[8],
					props[9],
					props[10],
					props[11],
					props[12],
					props[13],
					props[14],
					props[15],
					props[16],
					props[17],
					props[18],
					props[19]
				);
	      // add the particle
	      physicsStore.groups.characters.addObject(particle);
			}
			return true;
		},

		getRandomActor: function() {
			var
				actors = xlib.actorStore.actors,
				p,
				name,
				names = [];

			// get all actor names and store in array
			for (p in actors) {
				if (!actors.hasOwnProperty(p)) continue;
				// skip items
				if (actors[p].name.substring(0, 5) === "item_") continue;
				names.push(p);
			}
			// choose random name and return a reference to the actor object
			return actors[names[Math.floor(Math.random() * names.length)]];
		},

		// create a new actor instance from the provided actor and place it in the
		// game world. If a physics object is passed then use it, else use generic
		// physics settings with a random grounded position.
		// axisFlip will be used if provided, else a random one will be selected.
		// If dropFromAboveViewport is true, the instance will be placed above the
		// viewport when spawned so that it "drops" into the world.
		// todo: param order is horrible
		spawnActorInstance: function(actor, dropFromAboveViewport, physicsObject, axisFlip) {
			if (!actor) {
				xlib.log("Error:    xsor.spawnActorInstance: invalid actor passed.");
				return false;
			}

			var
				i,
				len,
				bounds = xlib.physicsStore.groups.characters.bounds,
				instanceName,
				item;

			// todo: validation
			if (!physicsObject) {
				physicsObject = new xlib.physicsStore.physicsObject(
					Math.random() * ((bounds.x + bounds.w - actor.actorConstants.width) - bounds.x) + bounds.x, // x
					bounds.y + bounds.h - actor.actorConstants.height, // y
					Math.random() * ((bounds.z + bounds.d - actor.actorConstants.depth) - bounds.z) + bounds.z, // z
					actor.actorConstants.width, // w
					actor.actorConstants.height, // h
					actor.actorConstants.depth, // d
					0, 0, 0,      // vx, vy, vz
					0, .42, 0, 0, // mass, dragCoefficient, restitution, immutable
					7             // useAxes is a bitwise value
				);
			}
			xlib.physicsStore.groups.characters.addObject(physicsObject);
			// generate random number as extension for name
			while (!instanceName || xlib.actorStore.instances[instanceName]) {
				instanceName = actor.name + Math.random().toString().substring(2, 5);
			}
			// create actor instance
			actorInstance = actor.createInstance(instanceName, physicsObject);
			if (Object.isEmpty(actorInstance)) {
				xlib.log("Error:    xsor.initSequences() couldn't create actor instance.");
				return false;
			}
			if (axisFlip === undefined) {
				axisFlip = Math.round(Math.random() * 1);
			}
			actorInstance.axisFlip = axisFlip;

			// possible chance of item!
			item = Math.floor(Math.random() * 10);
			switch (item) {
				case 1:
					actorInstance.userVars.dropItem = "item_apple";
					break;
				case 2:
					actorInstance.userVars.dropItem = "item_gold";
					break;
				case 3:
					actorInstance.userVars.dropItem = "item_money";
					break;
				case 4:
					actorInstance.userVars.dropItem = "item_chicken";
					break;
				case 5:
					actorInstance.userVars.dropItem = "item_oneup";
					break;
			}

			if (dropFromAboveViewport) {
				// change the instance's physics to place it above the viewport.
				actorInstance.physics.y = -actor.actorConstants.height - 50 - Math.random() * 100;
				// put instance into jump fall state
				// todo: hack: we use the jump rise state here instead because stateTick
				// is incremented to 1 before state 12.01 is processed, causing the
				// animName to not be set until the instance lands. Using the
				// makeStateChangesPending flag didn't resolve the incrementing problem;
				// find out why and change this to use the proper jump fall state (12.02).
				actorInstance.stateId = 10.01;
				actorInstance.stateTick = 0;
				// note: not setting an animName here causes a warning in the log.
				// The state machine will set an animName but not before the warning.
			}

			// xlib.log("spawned instance " + actorInstance.name + " at x " + physicsObject.x + ", y " + physicsObject.y + ", z " + physicsObject.z);
			return actorInstance;

		},

		// wipes out entire spaceship armies, although its use is looked down upon
		// by the Hegemony.
		deathwand: function() {
			var p;
			for (p in xlib.actorStore.instances) {
				if (xlib.actorStore.instances.hasOwnProperty(p)) {
					xlib.actorStore.instances[p].hitPoints = 0;
				}
			}
		},
		
		controlInstance: function(playerName, instanceName) {
			// force a player to control a specific instance.
			var
				players = xlib.playerStore.players,
				instances = xlib.actorStore.instances,
				p;
				
			if (!players[playerName]) {
				xlib.log("Error:    xsor.controlInstance() couldn't find player named '" + playerName + "'.");
				return false;
			}
			// the instance name doesn't have to be exact. Find the first instance
			// whose name begins with the value passed.
			// todo: change this when we stop sharing player/instance properties
			for (p in instances) {
				if (!instances.hasOwnProperty(p)) continue;
				if (instances[p].name.indexOf(instanceName) === 0) {
					if (!instances[p].player) {
						if (players[playerName].actorInstance) {
							// swap bindings to match the direction the new instance is in
							if (players[playerName].actorInstance.axisFlip !== instances[p].axisFlip) {
								players[playerName].swapBindings("F", "B");
							}
							// clear the player ref from the old instance
							players[playerName].actorInstance.player = null;
						}
						else {
							// player wasn't connected to an instance, so bindings should be
							// set assuming right is the facing direction.
							if (instances[p].axisFlip & xlib.INSTANCEDIRECTION_LEFT) {
								players[playerName].swapBindings("F", "B");
							}
						}
						// hook up the new refs
						players[playerName].actorInstance = instances[p];
						instances[p].player = players[playerName];
						// add hit callback to instance
						instances[p].addListener('hit', xsor.playerEventHit, players[playerName]);
						// players get additional life if instance at full health
						if (instances[p].hitPoints === instances[p].actor.actorConstants.hitPoints) {
							instances[p].hitPoints = xsor.playerHitPoints;
						}
						return true;
					}
				}
			}
			xlib.log("Error:    xsor.controlInstance() couldn't find an instance name similar to " + instanceName + ", or a player was already in control of the instance.");
			return false;
		},

		mainloop: function(msOut) {
			// mainloop is called from setTimeout, causing 'this' to be set to the
			// global window instead of the object that owns this function.
			// tldr; don't use 'this' here.

			// local var access
			var xsor = window.xsor;
			var xlib = window.xlib;
			var inputStore = xlib.inputStore;
			var physicsStore = xlib.physicsStore;
			var actorInstances = xlib.actorStore.instances;
			var players = xlib.playerStore.players;
			var player;
			var fps = xsor.fps
			var drawList = [];
			var i;

			// moz provides a parameter to functions called via setTimeout that states
			// how many ms out the setTimeout call was. Use it if available.
			if (msOut === undefined) msOut = "?";

			var actions = [], al;

			//if (!xlib.pause && inputStore.isCapturing()) {
			if (!xsor.pause) {
				// gameTick, the major timer for animation and events.
				xlib.gameTick++;
				// love not having to construct a Date object now
				var timeStart = Date.now();

				// get the final inputBuffer for this frame
				inputStore.getInputBuffer();

				// step through every player, test for sequences, and get an array of
				// actions back.
				for (i in players) {
					if (!players[i].actorInstance) continue;
					actions = inputStore.getNewActions(players[i].actorInstance.actor.sequenceList, players[i].bindingList);
					// now update the instance's actionbuffer
					players[i].actorInstance.updateActionBuffer(actions);
				}

				inputStore.prepareDevicesForNextTick();

				// make a copy of actions for the first character as a string to use
				// the debug further down
				var actions_string = players.Axel.actorInstance.actionBuffer.toString();

				// update physics objects
				// todo: we should be running this separately on each instance in the loop below
				physicsStore.groups.characters.updatePhysics(fps);

				// run the state machine on each instance
				for (i in actorInstances) {
					actorInstances[i].runStateMachines();
				}

				// get collisions for all actor intances with a hitbox in their current
				// animFrame. The third parameters is a user function used to filter
				// the results of the collision detection. In this case we're
				// eliminating collisions where the instances are more than 6 'pixel'
				// units distant on the z axis.
				xlib.actorStore.findInstanceCollisions(1, 0,
					// todo: change the instance collision function to do 3d collision
					// instead of using this filter. The actors already have a depth prop.
					// This is the first step towards collision boxes becoming 3d too.
					function(i1, b1, i2, b2) {
						return (Math.abs(i1.physics.z - i2.physics.z) <= 6) ?  true : false;
					},
					true
				);

				// todo: separate all the "hud" stuff from game processing
				// todo: reorganise this so the exceptions like drawing nameplates
				// for object_* instances only when ctrl is held aren't so bizarre

				var hitPoints, hitPointsTotal, hitPointsVisible, extraBars, barX, barY, barW = 22;
				var j, drawList = [], instance;
				var shadow = xlib.imageStore.images.shadows;

				for (i in actorInstances) {
					instance = actorInstances[i];
					// process any commands that were set inside each instance's state
					// machine. For hit and grab commands to work this requires the
					// collision detection finder be run on the instances first.
					instance.runStateCommands();

					// dispatch any state events
					instance.dispatchEvents();

					// add shadow to draw queue
					// todo: hack: change this to use a frame since we're likely to add
					// additional shadows.
					drawList.push([
						0, // image
						900,
						shadow.source,
						shadow.frameRects[0],
						Math.floor(((instance.physics.w - shadow.frameRects[0].w) / 2) + instance.physics.x),
						Math.floor(xlib.physicsStore.groups.characters.bounds.y + xlib.physicsStore.groups.characters.bounds.h - instance.physics.z - (shadow.frameRects[0].h * .6)),
						shadow.frameRects[0].w,
						shadow.frameRects[0].h,
						1
					]);

					// player nameplates and health bars.
					
					// skip if the instance is a misc object unless a player is
					// controlling it or if the ctrl key is held.
					if (instance.actor.name.substring(0, 7) === "object_" &&
					    !instance.player &&
					    !inputStore.keyboard.buttons[inputStore.keyboard.keyTable.ctrl]
					    ) {
						continue;
					}

					// generate health meter if the instance is player-controlled or has
					// less than full health.
					hitPoints = instance.hitPoints;
					// player instances may be granted additional hitPoints, so use the
					// highest number of the two.
					hitPointsTotal = Math.max(instance.actor.actorConstants.hitPoints, hitPoints);
					if (hitPoints > 0 && (instance.player || hitPoints < hitPointsTotal || inputStore.keyboard.buttons[inputStore.keyboard.keyTable.ctrl])) {

						barX = Math.floor(((instance.physics.w - barW) / 2) + instance.physics.x),
						barY = Math.floor(instance.physics.y - instance.physics.z) - 15;

						// if the ctrl key is held then show the instance name.
						if (inputStore.keyboard.buttons[inputStore.keyboard.keyTable.ctrl]) {
							drawList.push([
								2, // text
								instance.physics.z - .0001,
								null,
								"yellow",
								barX + 1,
								barY - 1,
								"8px '04b03Regular'",
								"left",
								"alphabetic",
								instance.name
							]);
						}
						// else if a player controls the instance then show the player name.
						else if (instance.player) {
							drawList.push([
								2, // text
								instance.physics.z - .0001,
								null,
								"white",
								barX + 1,
								barY - 1,
								"8px '04b03Regular'",
								"left",
								"alphabetic",
								instance.player.name
							]);
						}
						
						// the number of extra full bars of hitpoints that can't be shown on
						// the bar and will be indicated by dots underneath the bar.
						extraBars = Math.ceil(hitPoints / 200) - 1;
						// the amount of hitpoints left over after removing the excess that
						// will be shown as extra bars. Not a simple mod operation since we
						// want to show 200 if hitPoints is 400, etc.
						hitPointsVisible = hitPoints % 200 || hitPoints - (extraBars * 200);

						// horizontal, centered above instance
						// bar frame
						drawList.push([
							1, // rect
							instance.physics.z - .00009,
							null,
							"rgba(0,0,0,.6)",
							barX,
							barY,
							// Replacement for width line below. Makes bar fit health pools
							// smaller than 200.
							// Math.min(20, Math.floor(hitPointsTotal / 10)) + 2,
							barW,
							(extraBars) ? 6 : 4
						]);
						// pale background bar
						drawList.push([
							1, // rect
							instance.physics.z - .0001,
							null,
							"rgba(255, 255, 255, .2)",
							barX + 1,
							barY + 1,
							// Replacement for width line below. Makes bar fit health pools
							// smaller than 200.
							// Math.min(20, Math.floor(hitPointsTotal / 10)),
							barW - 2,
							2
						]);
						// life bar. As the instance runs out of hitpoints, the bar's colour
						// changes from transparent green to opaque red.
						drawList.push([
							1, // rect
							instance.physics.z - .0001,
							null,
							// scale the opacity of the health
							"rgba(" + Math.floor(255 - (255 * (hitPoints / hitPointsTotal))) + "," + Math.floor(255 * (hitPoints / hitPointsTotal)) + ",0, " + (.3 + (.7 * (1 - hitPoints / hitPointsTotal))) + ")",
							barX + 1,
							barY + 1,
							// Replacement for width line below. Makes bar fit health pools
							// smaller than 200.
							// Math.floor(Math.min(20, Math.floor(hitPointsTotal / 10)) * (hitPointsVisible / Math.min(200, hitPointsTotal))),
							Math.floor((barW - 2) * (hitPointsVisible / 200)),
							2
						]);
						// extra bar count
						for (j = 0; j < extraBars; j++) {
							// todo: test whether lines are faster here.
							drawList.push([
								1, // rect
								instance.physics.z - .0001,
								null,
								"rgb(200, 200, 0)",
								barX + 1 + (j * 3),
								barY + 4,
								1,
								1
							]);
						}

					}
					
				}
				
				// generate scoreboard
				var
					scoreboardX = 10,
					scoreboardY = 5;
					
				drawList.push([
					1, // rect
					-1,
					null,
					"rgba(0, 0, 0, .8)",
					0,
					0,
					xsor.viewportWidth,
					20
				]);
				for (i in players) {
					drawList.push([
						2, // text
						-1.5,
						null,
						"white",
						scoreboardX,
						scoreboardY + 8,
						"8px '04b03Regular'",
						"left",
						"alphabetic",
						players[i].name + ": " + players[i].userVars.score
					]);
					scoreboardX += 100;
				}

				// add the drawList to the drawQueue
				xlib.drawQueue.addDrawList(drawList);

				// get the actor instance draw list
				// todo: move getInstanceDrawList() onto actorInstance
				drawList = xlib.actorStore.getInstanceDrawList();
				if (drawList === false) {
					xlib.log("Error:    getInstanceDrawList() returned invalid draw list.");
				}
				else {
					// step through the drawList to fix up draw positions specific to this game
					var i = drawList.length;
					while (i--) {
						drawList[i][5] -= Math.floor(drawList[i][1]); // subtract z from y to give SOR 'depth' effect
					}
					// add the drawList to the drawQueue
					xlib.drawQueue.addDrawList(drawList);
				}

				// update the screen
				xsor.draw(xsor.context);

				// watch for the removal of an actor instance that's player-controlled.
				// If one is missing, spawn another instance of the same actor and
				// connect the player to it.
				// todo: it would be easier to just re-insert the instance back into
				// actorStore.instances (in a sense it's similar to removing an element
				// from the dom then re-inserting it back later). This would allow
				// keeping/removing specific properties of the instance (eg. userVars)
				// instead of wiping it all. However, we'll still need a new instance
				// if we allow a player to change actor (using a different character).
				var
					p,
					player,
					oldInstance,
					newInstance;
				for (p in xlib.playerStore.players) {
					// can the player's instance still be found in the actor instance
					// object? If not, spawn a new duplicate.
					player = xlib.playerStore.players[p];
					oldInstance = player.actorInstance;
					if (!xlib.actorStore.instances[oldInstance.name]) {
						newInstance = xsor.spawnActorInstance(
							oldInstance.actor,
							true,
							oldInstance.physics,
							oldInstance.axisFlip
						);
						// connect the player and new instance.
						// todo: change/remove this when we stop storing references in both
						// the player and instance
						newInstance.player = player;
						player.actorInstance = newInstance;
						// connect the custom hit function again
						player.actorInstance.addListener('hit', xsor.playerEventHit, player);
					}
				}

				// Wave-based enemy spawning system
				var ws = xsor.waveSystem;
				if (ws.enabled) {
					// Count alive enemies (non-player, non-object instances)
					var p, inst, actorName, enemyCount = 0, playerCount = 0;
					var playerNames = ['axel1', 'shiva1', 'rbear1'];
					for (p in xlib.actorStore.instances) {
						if (!xlib.actorStore.instances.hasOwnProperty(p)) continue;
						inst = xlib.actorStore.instances[p];
						actorName = inst.actor ? inst.actor.name : '';
						if (playerNames.indexOf(p) >= 0) {
							playerCount++;
						} else if (actorName.indexOf('object_') !== 0) {
							// Only count as enemy if actor name doesn't start with 'object_'
							enemyCount++;
						}
					}
					ws.enemiesAlive = enemyCount;

					// Debug logging every 60 frames (roughly once per second)
					if (!ws._debugCounter) ws._debugCounter = 0;
					ws._debugCounter++;
					if (ws._debugCounter % 60 === 0) {
						console.log('Wave debug: enemyCount=' + enemyCount + ', spawned=' + ws.enemiesSpawned + '/' + ws.enemiesPerWave + ', complete=' + ws.waveComplete + ', canProgress=' + ws.canProgress);
					}

					// If wave not complete and need more enemies
					if (!ws.waveComplete && ws.enemiesSpawned < ws.enemiesPerWave) {
						if (enemyCount < 4) {
							xsor.spawnActorInstance(xsor.getRandomActor(), true);
							ws.enemiesSpawned++;
							console.log('Spawned enemy, total spawned: ' + ws.enemiesSpawned);
						}
					}

					// Check if wave is complete (all enemies dead)
					if (ws.enemiesSpawned >= ws.enemiesPerWave && enemyCount === 0 && !ws.waveComplete) {
						console.log('Wave complete! All enemies killed.');
						ws.waveComplete = true;
						ws.canProgress = true;
						xsor.showGoArrow();
					}

					// Check for ENTER key to progress (using game's input system)
					var kb = xlib.inputStore.keyboard;
					var enterPressed = kb.buttons[kb.keyTable.enter];
					if (ws.canProgress && enterPressed && !ws._enterWasPressed) {
						console.log('ENTER pressed via game input - calling nextWave()');
						xsor.nextWave();
					}
					ws._enterWasPressed = enterPressed;

					// Update HUD
					xsor.updateWaveHUD();
				} else {
					// Original behavior - maintain actor count
					var p, j = 0;
					for (p in xlib.actorStore.instances) {
						if (!xlib.actorStore.instances.hasOwnProperty(p)) continue;
						j++;
					}
					if (j < xsor.minimumActorInstances) {
						xsor.spawnActorInstance(xsor.getRandomActor(), true);
					}
				}

				// wtb high res timer for js, pst
				var timeTotal = Date.now() - timeStart;
				// draw totalTime to the top left

				// string pad trick thanks to http://dev.enekoalonso.com/2010/07/20/little-tricks-string-padding-in-javascript/
				if (xlib.debug) {
					xlib.drawTextBlockTop(
						xsor.context,
						"8px '04b03Regular'",
						103,
						3,
						"gameTick:     " + xlib.gameTick,
						"Physics Objs: " + xlib.physicsStore.groups.characters.objects.length,
						"Render time:  " + timeTotal + "ms",
						"Possible FPS: " + ("    " + Math.floor(1000 / timeTotal)).slice(-5) + " / " + fps,
						"timeout lag:  " + ("    " + msOut).slice(-3) + "ms"
					);
					var tempChar = players.Axel.actorInstance;
					xlib.drawTextBlockTop(
						xsor.context,
						"8px '04b03Regular'",
						255,
						3,
						"instance:     " + tempChar.name,
						"inst pos:     " + (tempChar.physics.x  + "       ").slice(0, 7) + " "
						                 + (tempChar.physics.y  + "       ").slice(0, 7) + " "
						                 + (tempChar.physics.z  + "       ").slice(0, 7) + " ",
						"inst vel:     " + (tempChar.physics.vx + "       ").slice(0, 7) + " "
						                 + (tempChar.physics.vy + "       ").slice(0, 7) + " "
						                 + (tempChar.physics.vz + "       ").slice(0, 7) + " ",
						"inst state:   " + tempChar.stateId,
						"inst stateT:  " + tempChar.stateTick,
						// may not exist if the player's been knocked out and has respawned this frame
						"inst anim:    " + (tempChar.animInstance === null ? "n/a" : tempChar.animInstance.anim.name),
						"inst animT:   " + tempChar.animTick,
						"actionbuffer: " + actions_string
					);
				}

				// draw text console
				xsor.textConsole.draw();

			}

			// If we're using requestAnimationFrame then set up another callback.
			if (window.requestAnimFrame) {
				window.requestAnimFrame(
					function() {
						xsor.mainloop();
					},
					xsor.canvas
				);
			}

		},

		draw: function(context) {
			// local var access
			var xlib = window.xlib;
			var imageStore = xlib.imageStore;
			var animStore = xlib.animStore;
			var physicsStore = xlib.physicsStore;
			var drawQueue = xlib.drawQueue;
			var images = imageStore.images;

			// array used to temporary drawList
			var drawList = [];

			// clear canvas
			context.fillStyle = "black";
			context.fillRect(0, 0, this.viewportWidth, this.viewportHeight);

			// add background to draw queue
			var bg = images.background;
			drawList.push([
				0, // image
				1000,
				bg.source,
				bg.frameRects[0],
				0,
				0,
				bg.frameRects[0].w,
				bg.frameRects[0].h,
				1
			]);

			// fetch physics object and particles
			var physicsObjects = xlib.physicsStore.groups.characters.objects;
			var i = physicsObjects.length;
			// array used to store current particle's image and frame
			var currentFrame;
			// individual physics object for fast access
			var o;

			// step through each physics object, get its image and frame info, then
			// append it to the draw list.
			// todo: too many particle hacks. fix this to be fast for non-particles
			while (i--) {
				o = physicsObjects[i];
				if (o.colour !== undefined) {
					// get the current animation image and frame
					// particles have the animation stored in the physics object
					currentFrame = o.animInstance.getCurrentFrame();
					if (currentFrame === false) {
						xlib.log("Error:    xsor.draw(): Can't get current frame for particle " + i + ". Contents: " + o);
						continue;
					}
					currentFrame = currentFrame.getFlippedVersion((o.vx < 0) ? 1 : 0);
					if (currentFrame === false) {
						xlib.log("Error:    xsor.draw(): Can't get flipped current frame for particle " + i + ". Contents: " + o);
						continue;
					}
					if (xlib.debug && o.w < 0) {
						xlib.log("Error:    xsor.draw(): object width less than 0");
					}
					if (xlib.debug && o.h < 0) {
						xlib.log("Error:    xsor.draw(): object height less than 0");
					}
					drawList.push([
						0, // image
						o.z,
						currentFrame.image.source,
					  currentFrame.imageFrameRect,
						Math.floor(o.x) - currentFrame.imageFrameRect.ox,
					  // todo: get rid of y hack for z here
					  Math.floor(o.y - o.z) - currentFrame.imageFrameRect.oy,
					  // todo: need flag to indicate whether to scale the image to the particle w/h
					  currentFrame.imageFrameRect.w,
					  currentFrame.imageFrameRect.h,
					  o.opacity
					]);
				}
				else {
					// ignore non-particles for now. We'll use actorStore.getDrawList instead.
				}
				// Check drawQueue.draw() for a breakdown of array elements.
				// note that for particles we're rounding the positions down. This gives
				// faster framerates since the browser's draw routines are optimised
				// for when source pixels are aligned to destination pixels (memcopy
				// op vs scaling + filtering math).

			}

			// add the full particle list to the draw queue
			drawQueue.addDrawList(drawList);
			// draw everything in the draw queue
			drawQueue.draw(xsor.context);

			// debug: draw collision poly and first instance's collision box
			if (xlib.debug) {
				var
					i,
					boundary = xlib.physicsStore.groups.characters._polygonBoundary;
					
				// poly
				xsor.context.fillStyle = "rgba(255, 255, 255, .4)";
				xsor.context.beginPath();
				i = boundary.points.length;
				// the collision map is for xz and we're drawing it to xy, so we need to
				// transform the coordinates using the viewport height.
				context.moveTo(boundary.points[0][0], xsor.viewportHeight - boundary.points[0][1]);
				while (i--) {
					context.lineTo(boundary.points[i][0], xsor.viewportHeight - boundary.points[i][1]);
				}
				xsor.context.fill();
				xsor.context.closePath();
				
				// instance's aabb
				for (i in xlib.actorStore.instances) {
					var inst = xlib.actorStore.instances[i];
					var aabb = {
						x: inst.physics.x,
						y: 240 - inst.physics.z - inst.physics.d,
						w: inst.physics.w,
						h: inst.physics.d
					}
					if (boundary.isAABBInside(aabb.x, aabb.y, aabb.w, aabb.h)) {
						xsor.context.strokeStyle = "red";
					}
					else {
						xsor.context.strokeStyle = "blue";
					}
					xsor.context.lineWidth = 1;
					xsor.context.strokeRect(aabb.x, aabb.y, aabb.w, aabb.h);
				}
			}

			// debug: draw collision boxes. bodyBoxes are transparent blue and
			// hitBoxes transparent yellow.
			if (xlib.debug) {
				// todo: move this into its own function, and make it return a list
				// so we can apply game-specific fixes to the positioning (such as the
				// y/z fixup for 2.5D games).
				var actorInstances = xlib.actorStore.instances;
				var actorInstance, currentAnimFrame;
				var physics;
				var i, j, k, len, boxes, x, y;
				var boxTypes, boxTypesLen;
				for (i in actorInstances) {
					actorInstance = actorInstances[i];
					// skip over instances that were created via commands last frame --
					// they don't have an animInstance yet.
					if (!actorInstance.animInstance) continue;
					currentAnimFrame = actorInstance.animInstance.getCurrentFrame(actorInstance.animTick);
					physics = actorInstance.physics;
					for (j = 0; j < 2; j++) {
						if (j === 0) {
							// bodyBoxes
							boxes = currentAnimFrame.bodyBoxes;
							context.fillStyle = "rgba(80,80,255,.4)";
						}
						else {
							boxes = currentAnimFrame.hitBoxes;
							// use a different colour for hitboxes that have active hit commands.							
							if (actorInstance.isCommandActive("hit")) {
								context.fillStyle = "rgba(255,0,0,.4)";
							}
							else {
								context.fillStyle = "rgba(255,150,0,.4)";
							}
						}
						len = boxes.length;
						for (k = 0; k < len; k++) {
							// position of collision box depends on whether the object is flipped.
							// logic stolen from actorStore.getInstanceDrawList() with the
							// addition of the y/z axis change from the drawList.push() line above
							switch (actorInstance.axisFlip) {
								case 0:
									x = Math.floor(physics.x) + boxes[k].x;
									y = Math.floor(physics.y - physics.z) + boxes[k].y;
									break;
								case 1:
									x = Math.floor(physics.x + physics.w) - boxes[k].x - boxes[k].w;
									y = Math.floor(physics.y - physics.z) + boxes[k].y;
									break;
								case 2:
									x = Math.floor(physics.x) + boxes[j].x;
									y = Math.floor(physics.y + physics.h - physics.z) - boxes[k].y - boxes[k].h;
									break;
								case 4:
									x = Math.floor(physics.x + physics.w) - boxes[k].x - boxes[k].w;
									y = Math.floor(physics.y + physics.h - physics.z) - boxes[k].y - boxes[k].h;
									break;
							}
							context.fillRect(x, y, boxes[k].w, boxes[k].h);
						}
					}
				}
			}

			// debug: draw raw physics boxes
			if (0 && xlib.debug) {
				var groups = physicsStore.groups;
				var objects, objectsLen;
				var i, j, k, len, boxes, x, y;
				context.fillStyle = "rgba(0,255,0,.2)";
				for (i in groups) {
					objects = groups[i].objects;
					objectsLen = objects.length;
					for (j = 0; j < objects.length; j++) {
						context.fillRect(objects[j].x, objects[j].y - objects[j].z, objects[j].w, objects[j].h);
					}
				}
			}

			// show results for particle 1
			/*
			xlib.drawTextBlockTop("vx: " + physicsObjects[0].vx,
			                      "x : " + physicsObjects[0].x,
			                      "w : " + physicsObjects[0].w,
			                      "h : " + physicsObjects[0].h,
			                      "a : " + physicsObjects[0].animInstanceId);
			*/
		},

	}
})();