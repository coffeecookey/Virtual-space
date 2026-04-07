import * as PIXI from 'pixi.js';
import Room from '../entities/Room';
const API_URL = import.meta.env.VITE_API_URL || '';

let _obstacles = [];

const fetchMapData = async () => {
  const res = await fetch('/api/map')
  return res.json();
};

const loadMap = async (stage, { rooms, obstacles }) => {
  _obstacles = obstacles || [];

  const texture = await PIXI.Assets.load('/mapfinal_2000_1500.png');
  const bg = new PIXI.Sprite(texture);
  bg.width  = 2000;
  bg.height = 1493;
  stage.addChildAt(bg, 0);

  return rooms.map((roomData) => new Room(roomData));
};

const getObstacles = () => _obstacles;

export { fetchMapData, loadMap, getObstacles };
