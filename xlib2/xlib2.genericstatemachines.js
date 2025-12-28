xlib.genericStateMachines = {
	// each stateMachine has two functions:
	//   The resolver determines state transitions given an action and the current
	//   instance properties. It should contain almost all of the decisions that
	//   change the stateId itself.
	//   The processor determines the new instance properties such as movement and
	//   animation given a stateId and the current instance properties.
	// todo: set physics values independent of the pixel scale and the calling
	// function is responsible for scaling (preferred, since it makes the
	// state machine independent from the output device).
}

	// these special chunks of code handle resetting to idle states.
xlib.genericStateMachines.idleHandler = {
	resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
		// idle resolver: blank for now.
		return true;
	},
	processor: function(instance, physics, userVars, actorConstants, commands) {
		// if this chunk is reached in the state ruleset then no other state
		// has been matched and the idle state should take over.
		if (instance.stateId !== 0) {
			xlib.log("Warning:  unknown stateId '" + instance.stateId + "' entered; defaulting to idle stateId 0.");
			instance.stateId = 0;
		}
		if (instance.stateId === 0) {
			physics.vx = physics.vy = physics.vz = 0;
			if (instance.animName !== actorConstants.animIdle) {
				instance.animName = actorConstants.animIdle;
			}
		}
		// test for knockout and trigger appropriate state.
		if (instance.hitPoints <= 0) {
			if (instance.onGround) {
				instance.stateId = 35;
			}
			if (instance.inAir) {
				instance.stateId = 36;
			}
		}
		return true;
	}
};

xlib.genericStateMachines.character = {
	resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
		// convenience vars
		var i = instance;
		
		switch (actionName) {
			case "up":
				if (i.control) {
					i.stateId = 1;
					return true;
				}
				return false;

			case "upright":
				if (i.control) {
					i.stateId = 2;
					return true;
				}
				return false;

			case "right":
				if (i.control) {
					i.stateId = 3;
					return true;
				}
				return false;

			case "downright":
				if (i.control) {
					i.stateId = 4;
					return true;
				}
				return false;

			case "down":
				if (i.control) {
					i.stateId = 5;
					return true;
				}
				return false;

			case "downleft":
				if (i.control) {
					i.stateId = 6;
					return true;
				}
				return false;

			case "left":
				if (i.control) {
					i.stateId = 7;
					return true;
				}
				return false;

			case "upleft":
				if (i.control) {
					i.stateId = 8;
					return true;
				}
				return false;

			case "jump still":
				if (i.control) {
					i.stateId = 10;
					// remember whether the jump was still or moving. We'll check
					// this later to determine which jumping attack state to use.
					userVars._jumpType = "still";
					return true;
				}
				return false;

			case "jump left":
				if (i.control) {
					i.stateId = 11;
					userVars._jumpType = "moving";
					return true;
				}
				return false;

			case "jump right":
				if (i.control) {
					i.stateId = 12;
					userVars._jumpType = "moving";
					return true;
				}
				return false;
				
			case "jump in":
				if (i.control) {
					i.stateId = 13;
					userVars._jumpType = "moving";
					return true;
				}
				return false;

			case "jump out":
				if (i.control) {
					i.stateId = 14;
					userVars._jumpType = "moving";
					return true;
				}
				return false;

			case "jump in left":
				if (i.control) {
					i.stateId = 15;
					userVars._jumpType = "moving";
					return true;
				}
				return false;

			case "jump in right":
				if (i.control) {
					i.stateId = 16;
					userVars._jumpType = "moving";
					return true;
				}
				return false;
				
			case "jump out left":
				if (i.control) {
					i.stateId = 17;
					userVars._jumpType = "moving";
					return true;
				}
				return false;

			case "jump out right":
				if (i.control) {
					i.stateId = 18;
					userVars._jumpType = "moving";
					return true;
				}
				return false;

			case "get hit":
				// state id depends on whether it's a knockdown hit
				var j = i.incomingHits.length;
				while (j--) {
					if (i.incomingHits[j].knockdown === 1) {
						i.stateId = 22;
						return true;
					}
				}
				if (i.inAir) {
					i.stateId = 21;
					return true;
				}
				else {
					i.stateId = 20;
					return true;
				}

			case "rest":
				i.stateId = 30;
				return true;
		}
	},
	processor: function(instance, physics, userVars, actorConstants, commands) {

		// convenience vars
		var i = instance;

		switch (i.stateId) {
			case 1: // up
				switch (i.stateTick) {
					case 0:
						// if we're already in the walking anim, don't reset it. This keeps
						// the walking animation fluid between straight and diagonal movement.
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = physics.vy = 0;
						physics.vz = actorConstants.moveSpeedZ;
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 2: // upright
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = actorConstants.moveSpeedX;
						physics.vy = 0;
						physics.vz = actorConstants.moveSpeedZ;
						if (i.axisFlip & 1) {
							// todo: urgh
							i.axisFlip ^= 1;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
						}
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 3: // right
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = actorConstants.moveSpeedX;
						physics.vy = physics.vz = 0;
						if (i.axisFlip & 1) {
							i.axisFlip ^= 1;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
						}
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 4: // downright
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = actorConstants.moveSpeedX;
						physics.vy = 0;
						physics.vz = -actorConstants.moveSpeedZ;
						if (i.axisFlip & 1) {
							i.axisFlip ^= 1;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
						}
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 5: // down
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = physics.vy = 0;
						physics.vz = -actorConstants.moveSpeedZ;
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 6: // downleft
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = -actorConstants.moveSpeedX;
						physics.vy = 0;
						physics.vz = -actorConstants.moveSpeedZ;
						if (!(i.axisFlip & 1)) {
							i.axisFlip ^= 1;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
						}
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 7: // left
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = -actorConstants.moveSpeedX;
						physics.vy = physics.vz = 0;
						if (!(i.axisFlip & 1)) {
							i.axisFlip ^= 1;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
						}
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 8: // upleft
				switch (i.stateTick) {
					case 0:
						if (i.animName !== actorConstants.animMove) i.animName = actorConstants.animMove;
						physics.vx = -actorConstants.moveSpeedX;
						physics.vy = 0;
						physics.vz = actorConstants.moveSpeedZ;
						if (!(i.axisFlip & 1)) {
							i.axisFlip ^= 1;
							commands.push({
								type: "swapBindings",
								bind1: "F",
								bind2: "B"
							});
						}
						break;
					case 1:
						i.stateId = 0;
						break;
				}
				return true;

			case 10: // jump still start
				// written this way to accomodate anims only 1 frame long where the
				// final animTick will be 0. If we used a switch only one of the cases
				// will be followed and we'd skip straight over the stateId=0 code.
				// This structure is used for the other jump start states too.
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
				}
				return true;

			case 10.01: // jump rise
				switch (i.stateTick) {
					case 0:
						i.animName = actorConstants.animJumpRise;
						i.audioName = "jump";
						physics.vy = -actorConstants.jumpSpeedY;
						break;
					default:
						// switch to fall when vely becomes positive
						if (physics.vy > 0.1) i.stateId = 10.02;
						break;
				}
				return true;

			case 10.02: // jump fall
				switch (i.stateTick) {
					case 0:
						i.animName = actorConstants.animJumpFall;
						break;
					default:
						// switch to land when on ground
						if (i.onGround) i.stateId = 10.03;
						break;
				}
				return true;

			case 10.03: // jump land
				// written this way to work correctly with animations 1 frame long.
				// todo: check for other situations where this can occur.
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpLand;
					i.audioName = "land";
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 0;
				}
				return true;

			case 11: // jump left start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vx = -actorConstants.jumpSpeedX;
				}
				return true;

			case 12: // jump right start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vx = actorConstants.jumpSpeedX;
				}
				return true;

			case 13: // jump in start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vz = actorConstants.jumpSpeedZ;
				}
				return true;
				
			case 14: // jump out start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vz = -actorConstants.jumpSpeedZ;
				}
				return true;
				
			case 15: // jump in left start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vx = -actorConstants.jumpSpeedX;
					physics.vz = actorConstants.jumpSpeedZ;
				}
				return true;
				
			case 16: // jump in right start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vx = actorConstants.jumpSpeedX;
					physics.vz = actorConstants.jumpSpeedZ;
				}
				return true;
				
			case 17: // jump out left start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vx = -actorConstants.jumpSpeedX;
					physics.vz = -actorConstants.jumpSpeedZ;
				}
				return true;
				
			case 18: // jump out right start
				if (i.stateTick === 0) {
					i.animName = actorConstants.animJumpStart;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.animIsFinalTick) {
					i.stateId = 10.01;
					physics.vx = actorConstants.jumpSpeedX;
					physics.vz = -actorConstants.jumpSpeedZ;
				}
				return true;

			case 20: // get hit (ground)
				// Written this way to work properly with hitPauses of 0.
				// turn the instance to face the attacker
				if (i.stateTick === 0) {
					if (i.faceInstance(i.incomingHits[0].attackingInstance, 1)[0]) {
						commands.push({
							type: "swapBindings",
							bind1: "F",
							bind2: "B"
						});
					}
					physics.vx = physics.vy = physics.vz = 0;
					// always one of two anims so no need for a switch
					i.animName = (i.incomingHits[0].modifier === "low") ? actorConstants.animGetHitLow : actorConstants.animGetHitHigh;

					var j = i.incomingHits.length;
					while (j--) {
						// determine audio from hits
						if (i.incomingHits[j].audioGetHit) {
							i.audioName = i.incomingHits[j].audioGetHit;
						}
						else {
							switch (i.incomingHits[j].hitType) {
								case "light":
									i.audioName = actorConstants.audioGetHitLight;
									break;
								case "strong":
									i.audioName = actorConstants.audioGetHitStrong;
									break;
								case "fierce":
									i.audioName = actorConstants.audioGetHitFierce;
									break;
								case "knockdown":
									i.audioName = actorConstants.audioGetHitKnockdown;
									break;
								case "blunt":
									i.audioName = actorConstants.audioGetHitWeaponBlunt;
									break;
								case "stab":
									i.audioName = actorConstants.audioGetHitWeaponStab;
									break;
								case "slash":
									i.audioName = actorConstants.audioGetHitWeaponSlash;
									break;
								default:
									i.audioName = actorConstants.audioGetHitLight;
									break;
							}
						}
						// damage
						i.hitPoints -= i.incomingHits[j].damage;
					}
					// if health <= 0, change to appropriate knockout state
					if (i.hitPoints <= 0) {
						i.stateId = 35;
						return true;
					}
					// apply 'wobble' effect.
					commands.push({
						type: "visualeffect",
						effectType: "shake",
						ticks: actorConstants.getHitPause - 1,
						interval: 3,
						distances: [1,0,0]
					});
				}
				if (i.stateTick === actorConstants.getHitPause) {
					i.stateId = 0;
				}
				return true;

			case 21: // get hit (air)
				// Written this way to work properly with hitPauses of 0.
				if (i.stateTick === 0) {
					if (i.faceInstance(i.incomingHits[0].attackingInstance, 1)[0]) {
						commands.push({
							type: "swapBindings",
							bind1: "F",
							bind2: "B"
						});
					}
					physics.vx = (i.incomingHits[0].direction === 0) ? 135 : -135;
					physics.vy = -315;
					i.animName = actorConstants.animFall;
					
					var j = i.incomingHits.length;
					while (j--) {
						// determine audio from hits
						if (i.incomingHits[j].audioGetHit) {
							i.audioName = i.incomingHits[j].audioGetHit;
						}
						else {
							switch (i.incomingHits[j].hitType) {
								case "light":
									i.audioName = actorConstants.audioGetHitLight;
									break;
								case "strong":
									i.audioName = actorConstants.audioGetHitStrong;
									break;
								case "fierce":
									i.audioName = actorConstants.audioGetHitFierce;
									break;
								case "knockdown":
									i.audioName = actorConstants.audioGetHitKnockdown;
									break;
								case "blunt":
									i.audioName = actorConstants.audioGetHitWeaponBlunt;
									break;
								case "stab":
									i.audioName = actorConstants.audioGetHitWeaponStab;
									break;
								case "slash":
									i.audioName = actorConstants.audioGetHitWeaponSlash;
									break;
								default:
									i.audioName = actorConstants.audioGetHitLight;
									break;
							}
						}
						// damage
						i.hitPoints -= i.incomingHits[j].damage;
					}
					// if health <= 0, change to appropriate knockout state
					if (i.hitPoints <= 0) {
						i.stateId = 35;
						return true;
					}
				}
				if (physics.vy === 0 && i.onGround) {
					i.stateId = 30;
				}
				return true;

			case 22: // get hit (knockdown)
				if (i.stateTick === 0) {
					if (i.faceInstance(i.incomingHits[0].attackingInstance, 1)[0]) {
						commands.push({
							type: "swapBindings",
							bind1: "F",
							bind2: "B"
						});
					}
					i.animName = actorConstants.animFall;

					var j = i.incomingHits.length;
					while (j--) {
						// determine audio from hits
						if (i.incomingHits[j].audioGetHit) {
							i.audioName = i.incomingHits[j].audioGetHit;
						}
						else {
							switch (i.incomingHits[j].hitType) {
								case "light":
									i.audioName = actorConstants.audioGetHitLight;
									break;
								case "strong":
									i.audioName = actorConstants.audioGetHitStrong;
									break;
								case "fierce":
									i.audioName = actorConstants.audioGetHitFierce;
									break;
								case "knockdown":
									i.audioName = actorConstants.audioGetHitKnockdown;
									break;
								case "blunt":
									i.audioName = actorConstants.audioGetHitWeaponBlunt;
									break;
								case "stab":
									i.audioName = actorConstants.audioGetHitWeaponStab;
									break;
								case "slash":
									i.audioName = actorConstants.audioGetHitWeaponSlash;
									break;
								default:
									i.audioName = actorConstants.audioGetHitLight;
									break;
							}
						}
						// damage
						i.hitPoints -= i.incomingHits[j].damage;
					}
					// if health <= 0, change to appropriate knockout state
					if (i.hitPoints <= 0) {
						i.stateId = 35;
						return true;
					}
				}
				if (i.stateTick === actorConstants.getHitFallPause) {
					physics.vx = (i.lastIncomingHit.direction === 0) ? actorConstants.knockoutSpeedX : -actorConstants.knockoutSpeedX;
					physics.vy = -315;
					physics.vz = 0;
				}
				if (i.stateTick > actorConstants.getHitFallPause && physics.vy === 0 && i.onGround) {
					// recover when on ground
					// todo: bounce once? use friction to slow char vx?
					// todo: audio when hitting the ground? If we remove this, also
					// remove audioHitGround from the actorConstant objects
					// i.audioName = actorConstants.audioHitGround;
					i.stateId = 30;
				}
				return true;

			case 30: // rest
				if (i.stateTick === 0) {
					i.animName = actorConstants.animRest;
					physics.vx = physics.vy = physics.vz = 0;
				}
				if (i.stateTick === actorConstants.restTicks) {
					i.stateId = 31;
				}
				return true;

			case 31: // get up
				if (i.stateTick === 0) {
					i.animName = actorConstants.animGetUp;
				}
				if (i.animIsFinalTick) {
					i.stateId = 0;
				}
				return true;

			case 35: // knockout (ground)
				if (i.stateTick === 0) {
					i.animName = actorConstants.animKnockout;
					// todo: there has to be a better way to do this than looking at the
					// last tick's hits
					physics.vx = (i.lastIncomingHit.direction === 0) ? actorConstants.knockoutSpeedX : -actorConstants.knockoutSpeedX;
					physics.vy = actorConstants.knockoutSpeedY;
					physics.vz = actorConstants.knockoutSpeedZ;
				}
				// on land, switch to knockout rest state
				if (physics.vy === 0 && i.onGround) {
					i.stateId = 37;
				}
				return true;
				
			case 36: // knockout (air)
				if (i.stateTick === 0) {
					i.animName = actorConstants.animKnockout;
					physics.vx = (i.lastIncomingHit.direction === 0) ? actorConstants.knockoutSpeedX : -actorConstants.knockoutSpeedX;
					physics.vy = actorConstants.knockoutSpeedY;
					physics.vz = actorConstants.knockoutSpeedZ;
				}
				// on land, switch to knockout rest state
				if (physics.vy === 0 && i.onGround) {
					i.stateId = 37;
				}
				return true;

			case 37: // knockout rest and self destruct
				switch (i.stateTick) {
					case 0:
						physics.vx = physics.vy = physics.vz = 0;
						i.animName = actorConstants.animRest;
						break;
					
					case 30:
						i.audioName = actorConstants.audioKnockout;
						commands.push({
							type: "visualeffect",
							effectType: "blink",
							ticks: 30,
							interval: 2
						});
						break;
					
					case 60:
						// destroy instance
						commands.push({
							type: "destroySelf",
						});
						break;
				}
				return true;
		}
	}
};

xlib.genericStateMachines.object_smashable = {
	inherit: [xlib.genericStateMachines.character, xlib.genericStateMachines.idleHandler],
	resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
	},
	processor: function(instance, physics, userVars, actorConstants, commands) {

		// convenience vars
		var i = instance;

		switch (i.stateId) {

			case 35: // knockout ground
			case 36: // knockout air
				if (i.stateTick === 0) {
					i.animName = actorConstants.animKnockout;
					i.audioName = actorConstants.audioKnockout;
					physics.vx = (i.lastIncomingHit.direction === 0) ? actorConstants.knockoutSpeedX : -actorConstants.knockoutSpeedX;
					physics.vy = actorConstants.knockoutSpeedY;
					physics.vz = actorConstants.knockoutSpeedZ;
					// smashable should disappear while falling
					commands.push({
						type: "visualeffect",
						effectType: "blink",
						ticks: 45,
						interval: 2
					});
				}
				physics.vx *= .95;
				// after visual effect finishes, switch to knockout rest state
				if (i.stateTick === 45) {
					i.stateId = 37;
				}
				return true;
				
			case 37: // knockout rest and self destruct
				// destroy instance
				commands.push({
					type: "destroySelf",
				});
				// if a drop item has been, create it
				if (i.userVars.dropItem) {
					commands.push({
						type: "createactorinstance",
						actorName: i.userVars.dropItem,
						physicsGroup: "characters",
						x: "left",
						y: "bottom",
						//z: 0,
						axisFlip: xlib.INSTANCEDIRECTION_RIGHT,
						relativeToCanvas: false
					});
				}
				break;
		}
	}
};

xlib.genericStateMachines.item = {
	inherit: [xlib.genericStateMachines.idleHandler],
	resolver: function(actionName, instance, physics, userVars, actorConstants, commands) {
	},
	processor: function(instance, physics, userVars, actorConstants, commands) {

		// convenience vars
		var i = instance;

		switch (i.stateId) {
			case 0:
				// todo: remove me when pickup is implemented
				if (i.stateTick === 120) {
					i.stateId = 35;
				}
				break;
			
			case 35: // knockout ground
			case 36: // knockout air
				if (i.stateTick === 0) {
					i.animName = actorConstants.animKnockout;
					// smashable should disappear while falling
					commands.push({
						type: "visualeffect",
						effectType: "blink",
						ticks: 45,
						interval: 2
					});
				}
				// after visual effect finishes, switch to knockout rest state
				if (i.stateTick === 45) {
					i.stateId = 37;
				}
				return true;
				
			case 37: // knockout rest and self destruct
				// destroy instance
				commands.push({
					type: "destroySelf",
				});
				return true;
		}
	}
};