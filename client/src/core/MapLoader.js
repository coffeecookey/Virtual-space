import * as PIXI from 'pixi.js';
import Room from '../entities/Room';

let _obstacles = [];
let _rooms = [];

const fetchMapData = async () => {
  const res = await fetch('/api/map');
  return res.json();
};

const loadMap = async (stage, { rooms, obstacles }) => {
  _obstacles = obstacles || [];
  _rooms = rooms || [];

  const texture = await PIXI.Assets.load('/mapfinal_2000_1500.png');
  const bg = new PIXI.Sprite(texture);
  bg.width  = 2000;
  bg.height = 1493;
  stage.addChildAt(bg, 0);

  return rooms.map((roomData) => new Room(roomData));
};

const getObstacles = () => _obstacles;
const getRooms = () => _rooms;
const getMapRooms = () => _rooms;

export { fetchMapData, loadMap, getObstacles, getRooms, getMapRooms };
