// This file sets up the PIXI renderer for the game. 
// It initializes the canvas and provides access to the PIXI application 
// and stage for rendering game objects :)

import * as PIXI from 'pixi.js';
import theme from '../theme';

let app = null;

// Initialize the PIXI application and set up the canvas
const initRenderer = (canvasEl) => {
  app = new PIXI.Application({
    view: canvasEl,
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: theme.canvasBg,
    antialias: true,
    resolution: window.devicePixelRatio || 1,
    autoDensity: true,
  });

  // Handle window resize to keep the canvas full-screen
  window.addEventListener('resize', () => {
    app.renderer.resize(window.innerWidth, window.innerHeight);
  });

  return app;
};

const getApp = () => app;
const getStage = () => app?.stage;
export { initRenderer, getApp, getStage };
