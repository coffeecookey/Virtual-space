import * as PIXI from 'pixi.js';
import theme from '../theme';

const RADIUS = theme.playerRadius;
const LERP_FACTOR = 0.15;
const PROXIMITY_RING_RADIUS = 150;

class Player {
  constructor(userId, name, x, y, isLocal = false) {
    this.userId = userId;
    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;
    this._pulseT = 0;

    this.container = new PIXI.Container();

    if (isLocal) {
      this._ring = new PIXI.Graphics();
      this.container.addChild(this._ring);
      this._drawRing(1);
    }

    this._circle = new PIXI.Graphics();
    this._circle.beginFill(isLocal ? theme.localPlayer : theme.remotePlayer);
    this._circle.drawCircle(0, 0, RADIUS);
    this._circle.endFill();

    this._label = new PIXI.Text(name, {
      fontSize: theme.labelFontSize,
      fill: theme.labelColor,
      fontFamily: theme.labelFont,
    });
    this._label.anchor.set(0.5);
    this._label.y = RADIUS + 10;

    this.container.addChild(this._circle, this._label);

    if (isLocal) {
      const youTag = new PIXI.Text('(You)', {
        fontSize: 10,
        fill: theme.localPlayer,
        fontFamily: theme.labelFont,
      });
      youTag.anchor.set(0.5);
      youTag.y = RADIUS + 24;
      this.container.addChild(youTag);
    }

    this.container.x = x;
    this.container.y = y;
  }

  _drawRing(alpha) {
    this._ring.clear();
    this._ring.lineStyle(1.5, theme.localPlayer, alpha * 0.35);
    this._ring.drawCircle(0, 0, PROXIMITY_RING_RADIUS);
  }

  setLabelOpacity(alpha) {
    this._label.alpha = alpha;
  }

  update(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  tick() {
    if (this.isLocal) {
      this.container.x = this.targetX;
      this.container.y = this.targetY;

      this._pulseT += 0.04;
      const scale = 1 + Math.sin(this._pulseT) * 0.06;
      this._circle.scale.set(scale);

      const ringAlpha = 0.6 + Math.sin(this._pulseT * 0.7) * 0.4;
      this._drawRing(ringAlpha);
    } else {
      this.container.x += (this.targetX - this.container.x) * LERP_FACTOR;
      this.container.y += (this.targetY - this.container.y) * LERP_FACTOR;
    }
  }

  destroy(stage) {
    stage.removeChild(this.container);
    this.container.destroy({ children: true });
  }
}

export default Player;
