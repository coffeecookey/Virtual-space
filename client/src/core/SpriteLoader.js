import * as PIXI from 'pixi.js';

const FRAME_SIZE = 32;
const FRAME_COUNTS = { idle: 4, walk: 6, run: 6 };
const CHAR_FOLDERS = { 1: 'pink', 2: 'owl', 3: 'dude' };

const cache = {};

const sliceSheet = (texture, count) => {
  return Array.from({ length: count }, (_, i) =>
    new PIXI.Texture(texture.baseTexture, new PIXI.Rectangle(i * FRAME_SIZE, 0, FRAME_SIZE, FRAME_SIZE))
  );
};

export const preloadAll = async () => {
  PIXI.BaseTexture.defaultOptions.scaleMode = PIXI.SCALE_MODES.NEAREST;
  await Promise.all(
    Object.entries(CHAR_FOLDERS).map(async ([id, folder]) => {
      const paths = [`/sprites/${folder}/idle.png`, `/sprites/${folder}/walk.png`, `/sprites/${folder}/run.png`];
      const [idleTex, walkTex, runTex] = await Promise.all(paths.map(p => PIXI.Assets.load(p)));
      [idleTex, walkTex, runTex].forEach((t, i) => console.log('[SpriteLoader] Loaded:', paths[i], 'size:', t.width, 'x', t.height));
      cache[id] = {
        idle: sliceSheet(idleTex, FRAME_COUNTS.idle),
        walk: sliceSheet(walkTex, FRAME_COUNTS.walk),
        run:  sliceSheet(runTex,  FRAME_COUNTS.run),
      };
    })
  );
};

export const getTextures = (avatarId) => cache[avatarId] || cache[1];
