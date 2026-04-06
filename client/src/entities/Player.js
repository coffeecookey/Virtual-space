import * as PIXI from 'pixi.js';
import theme from '../theme';
import { getTextures } from '../core/SpriteLoader';

const LERP_FACTOR = 0.15;
const PROXIMITY_RING_RADIUS = 150;
const SCALE = 2;

class Player {
  constructor(userId, name, x, y, isLocal = false, avatarId = 1) {
    this.userId = userId;
    this.isLocal = isLocal;
    this.targetX = x;
    this.targetY = y;
    this.currentState = null;
    this._fading = false;

    this.container = new PIXI.Container();
    this.container.scale.set(SCALE);

    if (isLocal) {
      this._ring = new PIXI.Graphics();
      this.container.addChild(this._ring);
      this._drawRing(1);
    }

    // Sprite sub-container — only this gets flipped for direction
    this._spriteContainer = new PIXI.Container();
    this.container.addChild(this._spriteContainer);

    const textures = getTextures(avatarId) || {};
    this._sprites = {};
    try {
      for (const [state, frames] of Object.entries(textures)) {
        const anim = new PIXI.AnimatedSprite(frames);
        anim.anchor.set(0.5, 1.0);
        anim.animationSpeed = 0.15;
        anim.visible = false;
        anim.play();
        this._sprites[state] = anim;
        this._spriteContainer.addChild(anim);
      }
    } catch (e) {
      console.error('[Player] sprite creation failed for avatarId:', avatarId, e);
      const fallback = new PIXI.Graphics();
      fallback.beginFill(isLocal ? theme.localPlayer : theme.remotePlayer);
      fallback.drawCircle(0, -16, 16);
      fallback.endFill();
      this._spriteContainer.addChild(fallback);
    }

    // Labels go directly on container (not spriteContainer) so they don't flip
    this._label = new PIXI.Text(name, {
      fontSize: theme.labelFontSize / SCALE,
      fill: theme.labelColor,
      fontFamily: theme.labelFont,
    });
    this._label.anchor.set(0.5);
    this._label.y = 6;
    this.container.addChild(this._label);

    if (isLocal) {
      const youTag = new PIXI.Text('(You)', {
        fontSize: 8,
        fill: theme.localPlayer,
        fontFamily: theme.labelFont,
      });
      youTag.anchor.set(0.5);
      youTag.y = 15;
      this.container.addChild(youTag);
    }

    this.container.x = x;
    this.container.y = y;
    this.setState('idle');
  }

  _drawRing(alpha) {
    this._ring.clear();
    this._ring.lineStyle(0.75, theme.localPlayer, alpha * 0.35);
    this._ring.drawCircle(0, -16, PROXIMITY_RING_RADIUS / SCALE);
  }

  setState(newState) {
    if (newState === this.currentState || !this._sprites[newState]) return;
    if (this._sprites[this.currentState]) this._sprites[this.currentState].visible = false;
    this._sprites[newState].visible = true;
    this.currentState = newState;
  }

  setDirection(vx) {
    if (vx > 0) this._spriteContainer.scale.x =  1;
    if (vx < 0) this._spriteContainer.scale.x = -1;
  }

  setLabelOpacity(alpha) {
    this._label.alpha = alpha;
  }

  update(x, y) {
    this.targetX = x;
    this.targetY = y;
  }

  tick() {
    if (this._fading) {
      this.container.alpha -= 0.04;
      if (this.container.alpha <= 0) this.destroy(this._fadeStage);
      return;
    }

    if (this.isLocal) {
      this.container.x = this.targetX;
      this.container.y = this.targetY;
      if (this._ring) {
        this._pulseT = (this._pulseT || 0) + 0.04;
        this._drawRing(0.6 + Math.sin(this._pulseT * 0.7) * 0.4);
      }
    } else {
      const dx = this.targetX - this.container.x;
      const dy = this.targetY - this.container.y;
      this.container.x += dx * LERP_FACTOR;
      this.container.y += dy * LERP_FACTOR;
      const delta = Math.sqrt(dx * dx + dy * dy);
      this.setState(delta < 1.0 ? 'idle' : 'walk');
      if (Math.abs(dx) > 0.5) this.setDirection(dx);
    }
  }

  fadeOut(stage) {
    this._fading = true;
    this._fadeStage = stage;
  }

  destroy(stage) {
    stage.removeChild(this.container);
    this.container.destroy({ children: true, texture: false, baseTexture: false });
  }
}

export default Player;
