import * as PIXI from 'pixi.js';
import theme from '../theme';

const RADIUS = theme.playerRadius;

// lerp = linear interpolation factor for smooth movement of other players
// lerping is a common technique in game development to smoothly transition between positions, which helps to hide network latency 
// and create a more fluid experience for remote players. 
// The LERP_FACTOR determines how quickly the player sprite moves towards its target position each frame.
const LERP_FACTOR = 0.15;

// The Player class represents both the local player and remote players in the game.
class Player {
  constructor(userId, name, x, y, isLocal = false) {
    this.userId = userId;
    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;

    this.container = new PIXI.Container();

    // Create a circle to represent the player
    const circle = new PIXI.Graphics();
    circle.beginFill(isLocal ? theme.localPlayer : theme.remotePlayer);
    circle.drawCircle(0, 0, RADIUS);
    circle.endFill();

    // Create a label for the player's name
    const label = new PIXI.Text(name, {
      fontSize: theme.labelFontSize,
      fill: theme.labelColor,
      fontFamily: theme.labelFont,
    });
    label.anchor.set(0.5);
    label.y = RADIUS + 10;

    // Add the circle and label to the player's container
    this.container.addChild(circle, label);
    this.container.x = x;
    this.container.y = y;
  }

  // Update the player's target position. 
  // For the local player, this will be called with the new position based on user input.
  update(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  // The tick function is called every frame to update the player's position.
  tick() {
    // For the local player, we set the position directly to the target position for immediate response to user input.
    if (this.isLocal) {
      this.container.x = this.targetX;
      this.container.y = this.targetY;
    } 
    // For remote players, we smoothly interpolate their position towards the target position to create a smooth movement effect.
    else {
      this.container.x += (this.targetX - this.container.x) * LERP_FACTOR;
      this.container.y += (this.targetY - this.container.y) * LERP_FACTOR;
    }
  }

  // The destroy function removes the player's container from the stage and cleans up resources when a player leaves the game.
  destroy(stage) {
    stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}

export default Player;
