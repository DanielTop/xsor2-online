xsor.stateMachines = {
	
	character_axel: {
		init: function(instance) {
		},
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;

			switch (actionName) {

				case "grand upper":
					if (i.control) {
						i.stateId = 50;
						return true;
					}
					return false;

				case "punch":
					// initial punch
					if (i.control) {
						i.stateId = 60;
						break;
						// reset the vars used in this state
						userVars.punchConnected = 0;
						return true;
					}
					// second punch interrupt or repeat initial punch.
					// if we're already in this state, and we're within a certain
					// stateTick range, cancel this punch into another attack.
					else if (i.stateId === 60 && i.stateTick > 12 && i.stateTick < 22) {
						// if the first jab punch connected then switch to the second
						// jab punch state, else restart the existing punch state.
						i.stateId = (userVars.punchConnected === 1) ? 61 : 60;
						return true;
					}
					else if (i.stateId === 61 && i.stateTick > 12 && i.stateTick < 22) {
						// if the second jab punch connected then switch to the strong.
						if (userVars.punchConnected === 2) i.stateId = 62;
						return true;
					}
					else if (i.stateId === 62 && i.stateTick > 8 && i.stateTick < 22) {
						// if the strong punch connected then switch to the flurry.
						if (userVars.punchConnected === 3) i.stateId = 63;
						return true;
					}
					return false;

				case "flurry":
					if (i.control) {
						i.stateId = 63;
						return true;
					}
					return false;

				case "dragon wing":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;

				case "dragon smash":
					if (i.control) {
						i.stateId = 52;
						return true;
					}
					return false;

				case "jumping knee":
					if (((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02) && userVars._jumpType === "still") {
						i.stateId = 53;
						return true;
					}
					return false;

				case "jumping knee drop":
					if ((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02) {
						i.stateId = 54;
						return true;
					}
					return false;

				case "jumping kick":
					if (((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02) && userVars._jumpType === "moving") {
						i.stateId = 55;
						return true;
					}
					return false;
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {

			// convenience vars
			var i = instance;

			switch (i.stateId) {

				case 50: // grand upper
					if (i.stateTick === 0) {
						i.animName = "char_axel_grand_upper";
						i.audioName = "axel_grand_upper";
						physics.vx = 0;
						physics.vy = 0;
						physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							physics.vx = (i.axisFlip === 0) ? 75.6 : -75.6;
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2" // sound is the same as jump kick
								// hitpause 8
							});
							break;
						case "3 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 8,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_strong2" // sound is the same as jump kick
								// hitpause back to 5
							});
							break;
						case "5 0":
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 4,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown2" // sound is the same as jump kick
								// hitpause 8
							});
							break;
						case "6 0":
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 4,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2" // sound is the same as jump kick
								// unknown hitpause
							});
							break;
						case "7 0":
							physics.vx = 0;
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 10,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2" // sound is the same as jump kick
								// unknown hitpause
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 51: // dragon wing
					if (i.stateTick === 0) {
						i.animName = "char_axel_dragon_wing";
						i.audioName = "axel_dragon_wing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 28,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 52: // dragon smash
					if (i.stateTick === 0) {
						i.animName = "char_axel_dragon_smash";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
						case "2 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
						case "4 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
						case "7 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce1"
							});
							break;
						case "10 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_fierce1"
							});
							break;
						case "12 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce1"
							});
							break;
						case "14 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce1"
							});
							break;
						case "17 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 4,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce2"
							});
							break;
						case "19 0":
							physics.vy = -247.5;
							break;
						case "22 0":
							i.audioName = "land";
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 53: // jumping knee
					if (i.stateTick === 0) {
						i.animName = "char_axel_jump_knee";
						i.audioName = "axel_yell";
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 2,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
						case "2 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 8,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1
							});
							break;
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;

				case 54: // jumping knee drop
					if (i.stateTick === 0) {
						i.animName = "char_axel_jump_knee_drop";
						i.audioName = "axel_yell";
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								// todo: hack: this is a cludge for a hit that should
								// continue until cleared automatically on state change.
								// Should we make -1 a recognised value for "unbound"?
								ticks: 100000,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;

				case 55: // jumping kick
					if (i.stateTick === 0) {
						i.animName = "char_axel_jump_kick";
						i.audioName = "axel_yell";
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 100000,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2"
							});
							break;
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;

				case 60: // punch jab 1
					if (i.stateTick === 0) {
						i.animName = "char_axel_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								// todo: this hit can be detected in case "2 0" as well
								ticks: 3,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
						case "1 1":
						case "1 2":
							if (i.connectedHits["jabpunch1"]) {
								// remember that the hit connected. We'll use this in the
								// resolver later.
								userVars.punchConnected = 1;
							}
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 61: // punch jab 2
					if (i.stateTick === 0) {
						i.animName = "char_axel_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch2",
								hitType: "light",
								ticks: 3,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
						case "1 1":
						case "1 2":
							if (i.connectedHits["jabpunch2"]) {
								userVars.punchConnected = 2;
							}
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 62: // punch strong
					if (i.stateTick === 0) {
						i.animName = "char_axel_punch_strong";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 5,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
						case "1 1":
						case "1 2":
						case "1 3":
						case "1 4":
							if (i.connectedHits["strongpunch"]) {
								userVars.punchConnected = 3;
							}
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 63: // flurry
					if (i.stateTick === 0) {
						i.animName = "char_axel_flurry";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "3 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 5,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
						case "5 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 10,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
			}
		}
	},

	character_shiva_sor3: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;

			switch (actionName) {

				case "punch":
					// todo: should we have separate actions for each "step" in the
					// punch combo?
					// initial punch
					if (i.control) {
						i.stateId = 60;
						// reset the vars used in this state
						userVars.punchConnected = 0;
						return true;
					}
					// todo: update the stateTick stuff here to match those in
					// shiva's processor.
					// if we're already in this state, and we're within a certain
					// stateTick range, cancel this punch into another attack.
					else if (i.stateId === 60 && i.stateTick > 12 && i.stateTick < 22) {
						// if the first jab punch connected then switch to the second
						// jab punch state, else restart the existing punch state.
						i.stateId = (userVars.punchConnected === 1) ? 61 : 60;
						return true;
					}
					else if (i.stateId === 61 && i.stateTick > 12 && i.stateTick < 22) {
						// if the second jab punch connected then switch to the strong.
						if (userVars.punchConnected === 2) i.stateId = 62;
						return true;
					}
					else if (i.stateId === 62 && i.stateTick > 16 && i.stateTick < 21) {
						// if the strong punch connected then switch to the flurry.
						if (userVars.punchConnected === 3) i.stateId = 63;
					}
					return false;

				case "flurry":
					if (i.control) {
						i.stateId = 63;
						return true;
					}
					return false;

				case "cutter":
					if (i.control) {
						i.stateId = 50;
						return true;
					}
					return false;

				case "standing flame":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;

				case "somersault":
					if (i.control) {
						i.stateId = 52;
						return true;
					}
					return false;

				case "jumping attack still":
					if (((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02) && userVars._jumpType === "still") {
						i.stateId = 53;
						return true;
					}
					return false;

				case "jumping attack drop":
					if ((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02) {
						i.stateId = 54;
						return true;
					}
					return false;

				case "jumping attack":
					if (((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02) && userVars._jumpType === "moving") {
						i.stateId = 55;
						return true;
					}
					return false;

			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {

			// convenience vars
			var i = instance;

			switch (i.stateId) {

				case 50: // cutter
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_cutter";
						i.audioName = "cutter";
						physics.vx = 0;
						physics.vy = 0;
						physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 6,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2"
							});
							break;
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 3,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2"
							});
							break;
						case "2 0":
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 3,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 51: // standing flame
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_standing_flame";
						i.audioName = "special1";
						physics.vx = 0;
						physics.vy = 0;
						physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "blunt",
								ticks: 24,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 52: // somersault
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_somersault";
						i.audioName = "shiva_sor3_somersault";
						physics.vx = 0;
						physics.vy = 0;
						physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "3 0":
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 28,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2"
							});
							break;
						case "4 0":
							commands.push({
								type: "hit",
								hitType: "blunt",
								ticks: 28,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown2"
							});
							break;
						case "5 0":
							physics.vy = -225;
							physics.vx = (i.axisFlip == 0) ? 78.75 : -78.75;
							break;
						case "5 1":
						case "5 2":
						case "5 3":
						case "5 4":
						case "5 5":
							physics.vx *= .05;
							break;
						case "6 0":
							i.axisFlip = (i.axisFlip == 0) ? 1 : 0;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
							break;
						case "6 1":
						case "6 2":
						case "6 3":
						case "6 4":
							physics.vx *= .05;
							break;
					}
					// switch to customer land state when on ground
					if (i.animFrameNo > 7 && i.onGround) i.stateId = 52.01;
					return true;

				case 52.01: // custom land state for somersault
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_somersault_land";
						i.audioName = "land";
						physics.vx = physics.vy = 0;
					}
					if (i.animIsFinalTick) {
						i.axisFlip = (i.axisFlip == 0) ? 1 : 0;
						commands.push({
							type: "swapBindings",
							bind1: "F",
							bind2: "B"
						});
						i.stateId = 0;
					}
					return true;

				case 53: // jumping attack still
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_jump_attack_drop";
						i.audioName = "shiva_sor3_yell";
						commands.push({
							type: "hit",
							hitType: "strong",
							ticks: 24,
							damage: 25,
							knockdown: 1,
							hitsparkId: 1,
						});
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;

				case 54: // jumping attack drop
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_jump_attack_drop";
						i.audioName = "shiva_sor3_yell";
						commands.push({
							type: "hit",
							hitType: "light",
							ticks: 24,
							damage: 25,
							knockdown: 0,
							hitsparkId: 0,
						});
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;

				case 55: // jumping attack
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_jump_attack";
						i.audioName = "shiva_sor3_yell";
						commands.push({
							type: "hit",
							hitType: "knockdown",
							ticks: 100000,
							damage: 25,
							knockdown: 1,
							hitsparkId: 1,
						});
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;

				case 60: // punch jab 1
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								// todo: this hit can be detected in case "2 0" as well
								ticks: 5,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
						case "1 1":
						case "1 2":
						case "1 3":
						case "1 4":
							if (i.connectedHits["jabpunch1"]) {
								// remember that the hit connected. We'll use this in the
								// resolver later.
								userVars.punchConnected = 1;
							}
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 61: // punch jab 2
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch2",
								hitType: "light",
								ticks: 3,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
						case "1 1":
						case "1 2":
						case "1 3":
						case "1 4":
							if (i.connectedHits["jabpunch2"]) {
								userVars.punchConnected = 2;
							}
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 62: // punch strong
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_punch_strong";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
						case "1 1":
						case "1 2":
						case "1 3":
							if (i.connectedHits["strongpunch"]) {
								userVars.punchConnected = 3;
							}
							break;
						case "2 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 4,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 63: // flurry
					if (i.stateTick === 0) {
						i.animName = "char_shiva_sor3_flurry";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 20,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_fierce2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

			case 31: // custom get up state since physics are involved
				switch (i.stateTick) {
					case 0:
						i.animName = actorConstants.animGetUp;
						physics.vx = (i.axisFlip === 1) ? -54 : 54;
						physics.vy = -225;
						break;
				}
				// switch to special landing state when on ground
				if (i.stateTick > 33 && i.onGround) {
					physics.vx = 0;
					i.stateId = 100;
				}
				return true;

			case 100: // land from jumping out of rest
				switch (i.stateTick) {
					case 0:
						i.animName = "char_shiva_sor3_rest_land";
						break;
					case i.animInstance.anim.tickLength - 1:
						i.stateId = 0;
						break;
				}
				return true;
			}
		}
	},
	npc_donovan: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			var i = instance;
	
			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "uppercut":
					if (i.control) {
						i.stateId = 61;
						return true;
					}
					return false;
	
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
			var i = instance;
	
			switch (i.stateId) {
				case 60: // punch
					if (i.stateTick === 0) {
						i.animName = "npc_donovan_punch";
						physics.vx = physics.vy = physics.vz = 0
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 20,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
					}
					if (i.animIsFinalTick) {
						i.stateId = 0;
					}
					return true;
	
				case 61: // uppercut
					if (i.stateTick === 0) {
						i.animName = "npc_donovan_uppercut";
						physics.vx = physics.vy = physics.vz = 0
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 25,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) {
						i.stateId = 0;
					}
					return true;
			}
		}
	},
	npc_galsia: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			var i = instance;
	
			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				// todo: knife pickup, custom get hit knockdown state to drop the
				// knife, and moving around with the knife equipped. Pickup and drop
				// can be written into the generic character code
	
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
			var i = instance;
	
			switch (i.stateId) {
				case 60: // punch
					if (i.stateTick === 0) {
						i.animName = "npc_galsia_punch";
						physics.vx = physics.vy = physics.vz = 0
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 20,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
					}
					if (i.animIsFinalTick) {
						i.stateId = 0;
					}
					return true;
	
			}
		}
	},
	npc_hakuyo: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;
	
			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "punch strong":
					if (i.control) {
						i.stateId = 62;
						return true;
					}
					return false;
	
				case "kick":
					if (i.control) {
						i.stateId = 63;
						return true;
					}
					return false;
	
				case "fireball":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;
	
				case "jumping attack":
					if (((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02)) {
						i.stateId = 55;
						return true;
					}
					return false;
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
	
			// convenience vars
			var i = instance;
	
			switch (i.stateId) {
	
				case 51: // fireball
					if (i.stateTick === 0) {
						i.animName = "npc_hakuyo_fireball";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							i.audioName = "swing";
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 2,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_light2"
							});
							break;
						case "3 0":
							i.audioName = "special1";
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 10,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_fireball"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 55: // jumping attack
					if (i.stateTick === 0) {
						i.animName = "npc_hakuyo_jump_attack";
						i.audioName = "hakuyo_yell";
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 100000,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2"
							});
							break;
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;
	
				case 60: // punch jab
					if (i.stateTick === 0) {
						i.animName = "npc_hakuyo_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 6,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 62: // punch strong
					if (i.stateTick === 0) {
						i.animName = "npc_hakuyo_punch_strong";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 5,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 63: // kick
					if (i.stateTick === 0) {
						i.animName = "npc_hakuyo_kick";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 5,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
			}
		}
	},
	npc_raven: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;
	
			switch (actionName) {
	
				case "kick low":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "kick mid":
					if (i.control) {
						i.stateId = 61;
						return true;
					}
					return false;
	
				case "kick high":
					if (i.control) {
						i.stateId = 62;
						return true;
					}
					return false;
	
				case "knee":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;
	
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
	
			// convenience vars
			var i = instance;
	
			switch (i.stateId) {
	
				case 51: // knee
					if (i.stateTick === 0) {
						i.animName = "npc_raven_knee";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							physics.vx = (i.axisFlip === 1) ? -180 : 180;
							physics.vy = -135;
							commands.push({
								type: "hit",
								hitType: "strong",
								ticks: 100000,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_light2"
							});
							break;
					}
					// switch to land state when on ground after the knee
					if (i.animFrameNo === 1 && i.animFrameTick > 1 && i.onGround) {
						i.stateId = 10.03;
					}
					return true;
	
				case 60: // kick low
					if (i.stateTick === 0) {
						i.animName = "npc_raven_kick_low";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 2,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
						case "2 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 6,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 61: // kick mid
					if (i.stateTick === 0) {
						i.animName = "npc_raven_kick_mid";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 2,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
						case "2 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "strong",
								ticks: 6,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 62: // kick high
					if (i.stateTick === 0) {
						i.animName = "npc_raven_kick_high";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 2,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
						case "2 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 7,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
			}
		}
	},
	npc_signal: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;
	
			switch (actionName) {
	
				case "backhand":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "slide":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;
	
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
	
			// convenience vars
			var i = instance;
	
			switch (i.stateId) {
	
				case 51: // slide
					if (i.stateTick === 0) {
						i.animName = "npc_signal_slide";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							i.audioName = "signal_slide";
							physics.vx = (i.axisFlip === 1) ? -292.5 : 292.5;
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 100000,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1
							});
							break;
					}
					// slow the slide each tick
					physics.vx *= .934;
					// switch to slide get up state when the slide finishes
					if (i.animFrameNo === 1 && i.animFrameTick > 0 && Math.abs(physics.vx) < 9) {
						i.stateId = 51.01;
					}
					return true;
	
				case 51.01: // slide get up
					if (i.stateTick === 0) {
						i.animName = "npc_signal_slide_get_up";
						physics.vx = 0;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 60: // backhand
					if (i.stateTick === 0) {
						i.animName = "npc_signal_backhand";
						physics.vx = physics.vy = physics.vz = 0;
						// turn signal to face the opposite direction
						// todo: this now causes the enemy to fall towards signal. Flip
						// the backhand sprites in the spritesheet and remove the turn here
						i.axisFlip = (i.axisFlip === 0) ? 1 : 0;
						commands.push({
							type: "swapBindings",
							bind1: "F",
							bind2: "B"
						});
					}
					switch (i.animFrameNoAndTick) {
						case "3 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 8,
								damage: 25,
								knockdown: 1,
								hitsparkId: 0,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) {
						// turn signal to face the original direction
						i.axisFlip = (i.axisFlip === 0) ? 1 : 0;
						commands.push({
							type: "swapBindings",
							bind1: "F",
							bind2: "B"
						});
						i.stateId = 0;
					}
					return true;
			}
		}
	},
	npc_rbear: {
		// todo: combo for jab, jab, knockdown?
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;
	
			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "punch strong":
					if (i.control) {
						i.stateId = 62;
						return true;
					}
					return false;
	
				case "rush":
					if (i.control) {
						i.stateId = 50;
						return true;
					}
					return false;
	
				case "uppercut":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;

				case "backhit":
					if (i.control) {
						i.stateId = 52;
						return true;
					}
					return false;

				case "jumping attack":
					if (((i.stateId === 10.01 && i.stateTick > 4) || i.stateId === 10.02)) {
						i.stateId = 55;
						return true;
					}
					return false;
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
	
			// convenience vars
			var i = instance;
	
			switch (i.stateId) {
	
				case 50: // rush
					if (i.stateTick === 0) {
						i.animName = "npc_rbear_rush";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							physics.vx = (i.axisFlip === 0) ? 180 : -180;
							break;
						case "1 0":
							i.audioName = "swing";
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 6,
								damage: 25,
								knockdown: 0,
								hitsparkId: 1,
								audioGetHit: "get_hit_strong2"								
							});
							break;
						case "2 0":
							physics.vx = 0;
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 10,
								damage: 25,
								knockdown: 1,
								hitsparkId: 0
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;				
	
				case 51: // uppercut
					if (i.stateTick === 0) {
						i.animName = "npc_rbear_uppercut";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							i.audioName = "swing";
							commands.push({
								type: "hit",
								hitType: "jab",
								ticks: 4,
								damage: 10,
								knockdown: 0,
								hitsparkId: 1,
							});
							break;
						case "2 0":
							physics.vx = (i.axisFlip === 1) ? -30 : 30;
							physics.vy = -235;
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 14,
								damage: 30,
								knockdown: 1,
								hitsparkId: 1,
							});
							break;
					}
					// switch to land state when on ground after the uppercut
					if (i.animFrameNo === 3 && i.animFrameTick > 1 && i.onGround) {
						i.stateId = 10.03;
					}
					return true;

				case 52: // backhit
					if (i.stateTick === 0) {
						i.animName = "npc_rbear_backhit";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							i.audioName = "swing";
							commands.push({
								type: "hit",
								hitType: "jab",
								ticks: 6,
								damage: 10,
								knockdown: 1,
								hitsparkId: 1,
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 55: // jumping attack
					if (i.stateTick === 0) {
						i.animName = "npc_rbear_jump_attack";
					}
					switch (i.animFrameNoAndTick) {
						case "0 0":
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 100000,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1
							});
							break;
					}
					// switch to land when on ground
					if (i.onGround) i.stateId = 10.03;
					return true;
	
				case 60: // punch jab
					if (i.stateTick === 0) {
						i.animName = "npc_rbear_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 6,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 62: // punch strong
					if (i.stateTick === 0) {
						i.animName = "npc_rbear_punch_strong";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 5,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
			}
		}
	},
	npc_thug: {
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			var i = instance;
	
			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				// todo: block
	
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
			var i = instance;
	
			switch (i.stateId) {
				case 60: // punch
					if (i.stateTick === 0) {
						i.animName = "npc_thug_punch";
						physics.vx = physics.vy = physics.vz = 0
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								hitType: "light",
								ticks: 20,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0
							});
							break;
					}
					if (i.animIsFinalTick) {
						i.stateId = 0;
					}
					return true;
	
			}
		}
	},
	npc_barbon: {
		// todo: throw, block, ripshirt (first frame should be separate state ("idle
		// shirt"?) that state 0 switches to depending on a custom variable. Any
		// input triggers the "rip shirt" state, updates the var, plays the anim,
		// then moves into the standard idle state.
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;

			// special case for 'idle shirt' -> 'rip shirt' since it will trigger on
			// any button press. It can't go in the switch below since it'd get in
			// the way of other actions.
			if (actionName === "rip shirt") {
				if (i.stateId === 100) {
					i.stateId = 101;
					// tell the state machine that we've handled the action, and not to
					// check any other actions in the queue.
					return true;
				}
				else {
					// tell the state machine that this action was invalid, and to try
					// other actions in the queue.
					return false;
				}
			}

			// todo: there's three values that can be sent back from the processor:
			//   true:      tells the state machine that we recognised the action and
			//              it has been accepted as valid, and to ignore other actions
			//              in the current action buffer.
			//   false:     tells the state machine that we recognised the action but
			//              that it's invalid right now, so try the next action in the
			//              current action buffer.
			//   undefined: tells the state machine that we don't recognise the action
			//              and to fall back to the inherited state machines to try
			//              to handle the action.
			// These return values are obscure in nature and should be replaced with
			// constants that are better understood. What is the perf impact?

			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "snapkick":
					if (i.control) {
						i.stateId = 62;
						return true;
					}
					return false;
	
				case "spinkick":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;

			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
	
			// convenience vars
			var i = instance;
	
			switch (i.stateId) {

				case 0: // special case for initial 'idle shirt' state
					if (!userVars.shirtRipped) {
						i.stateId = 100;
						return true;
					}
					break;
					
				case 100: // idle shirt
					if (i.stateTick === 0) {
						physics.vx = physics.vy = physics.vz = 0;
						i.animName = "npc_barbon_idle_shirt";
					}
					return true;
					
				case 101: // rip shirt
					switch (i.animFrameNoAndTick) {
						case "0 0":
							i.animName = "npc_barbon_ripshirt";
							// todo: audio?
							break;
						case "2 0":
						// shirt particles
						commands.push({
							type: "particleexplosion",
							animNames: [
								"npc_barbon_cloth_4",
								"npc_barbon_cloth_5",
								"npc_barbon_cloth_6",
								"npc_barbon_cloth_2",
								"npc_barbon_cloth_3",
								"npc_barbon_cloth_7",
								"npc_barbon_cloth_1"
							], 
							x: 13,                   
							y: 15,                   
							z: -.005,                    
							relativeToCanvas: false,
							vx: [80, 120],                   
							vy: [100, 140],                   
							vz: [0, 0],
							respectGravity: true,    
							ticks: 30,               
							distance: 12,
							count: 7,
							randomAnim: false,       
							distributeRandomly: false
						});
					}
					if (i.animIsFinalTick) {
						userVars.shirtRipped = true;
						i.stateId = 0;
					}
					return true;

				case 20: // if hit while wearing shirt, automatically rip it
				case 21:
				case 22:
					if (i.stateTick === 0 && !userVars.shirtRipped) {
						userVars.shirtRipped = true;
						// intentionally returning undefined so that the inherited generic
						// state machine handles the hit.
						// shirt particles, duplicated from state 101 above
						commands.push({
							type: "particleexplosion",
							animNames: [
								"npc_barbon_cloth_4",
								"npc_barbon_cloth_5",
								"npc_barbon_cloth_6",
								"npc_barbon_cloth_2",
								"npc_barbon_cloth_3",
								"npc_barbon_cloth_7",
								"npc_barbon_cloth_1"
							], 
							x: 13,                   
							y: 15,                   
							z: -.005,                    
							relativeToCanvas: false,
							vx: [80, 120],                   
							vy: [100, 140],                   
							vz: [0, 0],
							respectGravity: true,    
							ticks: 30,               
							distance: 12,
							count: 7,
							randomAnim: false,       
							distributeRandomly: false
						});
					}
					return undefined;

				case 51: // spinkick
					if (i.stateTick === 0) {
						i.animName = "npc_barbon_spinkick";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "3 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 14,
								damage: 30,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
						case "6 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 14,
								damage: 30,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 60: // punch
					if (i.stateTick === 0) {
						i.animName = "npc_barbon_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "3 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "strong",
								ticks: 8,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 62: // snapkick
					if (i.stateTick === 0) {
						i.animName = "npc_barbon_snapkick";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							commands.push({
								type: "hit",
								hitType: "fierce",
								ticks: 7,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

			}
		}
	},
	npc_jack: {
		// todo: knife instance, instance ownership? laugh sound
		inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
		resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
			// convenience vars
			var i = instance;
	
			switch (actionName) {
	
				case "punch":
					if (i.control) {
						i.stateId = 60;
						return true;
					}
					return false;
	
				case "punch strong":
					if (i.control) {
						i.stateId = 62;
						return true;
					}
					return false;
	
				case "knife equip":
					if (i.control) {
						i.stateId = 50;
						return true;
					}
					return false;
	
				case "knife throw":
					if (i.control) {
						i.stateId = 51;
						return true;
					}
					return false;

				case "slash":
					if (i.control) {
						i.stateId = 52;
						return true;
					}
					return false;

				case "laugh":
					if (i.control) {
						i.stateId = 63;
						return true;
					}
					return false;				
			}
		},
		processor: function(instance, physics, userVars, actorConstants, commands) {
	
			// convenience vars
			var i = instance;
	
			switch (i.stateId) {
	
				case 50: // knife equip
					if (i.stateTick === 0) {
						i.animName = "npc_jack_equipknife";
						physics.vx = physics.vy = physics.vz = 0;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 51: // knife throw
					if (i.stateTick === 0) {
						i.animName = "npc_jack_throwknife";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							i.audioName = "swing";
							commands.push({
								type: "hit",
								hitType: "jab",
								ticks: 4,
								damage: 10,
								knockdown: 0,
								hitsparkId: 1,
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 52: // slash
					if (i.stateTick === 0) {
						i.animName = "npc_jack_slash";
						physics.vx = (i.axisFlip === 0) ? 180 : -180;						
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							i.audioName = "swing";
							physics.vx = 0;
							commands.push({
								type: "hit",
								hitType: "knockdown",
								ticks: 10,
								damage: 25,
								knockdown: 1,
								hitsparkId: 0
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
					
				case 60: // punch jab
					if (i.stateTick === 0) {
						i.animName = "npc_jack_punch";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "1 0":
							commands.push({
								type: "hit",
								name: "jabpunch1",
								hitType: "light",
								ticks: 6,
								damage: 25,
								knockdown: 0,
								hitsparkId: 0,
								audioGetHit: "get_hit_light2"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;
	
				case 62: // punch strong
					if (i.stateTick === 0) {
						i.animName = "npc_jack_punch_strong";
						i.audioName = "swing";
						physics.vx = physics.vy = physics.vz = 0;
					}
					switch (i.animFrameNoAndTick) {
						case "2 0":
							commands.push({
								type: "hit",
								name: "strongpunch",
								hitType: "strong",
								ticks: 5,
								damage: 25,
								knockdown: 1,
								hitsparkId: 1,
								audioGetHit: "get_hit_knockdown3"
							});
							break;
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

				case 63: // laugh
					if (i.stateTick === 0) {
						i.animName = "npc_jack_laugh";
						physics.vx = physics.vy = physics.vz = 0;
						// todo: laugh audio
					}
					if (i.animIsFinalTick) i.stateId = 0;
					return true;

			}
		}
	},
}