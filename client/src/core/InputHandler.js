// This file handles user input by tracking which keys are currently pressed.
// It provides a function to get the current velocity based on the pressed keys

const keys = {};

const initInput = () => {
  window.addEventListener('keydown', (e) => { keys[e.code] = true; });
  window.addEventListener('keyup', (e) => { keys[e.code] = false; });
};

// TO DO
// using arrow keys rn, may add WASD later since I'm more of a WASD person myself lol
const getVelocity = (speed = 4) => {
  let vx = 0, vy = 0;
  if (keys['ArrowLeft']  || keys['KeyA']) vx -= speed;
  if (keys['ArrowRight'] || keys['KeyD']) vx += speed;
  if (keys['ArrowUp']    || keys['KeyW']) vy -= speed;
  if (keys['ArrowDown']  || keys['KeyS']) vy += speed;
  return { vx, vy };
};

// TO DO
// mouse input so that user clicks and quickly goes/transports to that location on map?

export { initInput, getVelocity };
