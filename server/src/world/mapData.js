const rooms = [
  { id: 'lobby',   name: 'Lobby',        x: 90,   y: 89,  width: 915, height: 609 },
  { id: 'meeting', name: 'Meeting Room',  x: 1270, y: 92,  width: 640, height: 506 },
  { id: 'lounge',  name: 'Lounge',        x: 684,  y: 885, width: 690, height: 530 },
];

const obstacles = [
  { id: 'lobby_bottomleft_wall',     x: 90,    y: 705,    width: 370, height: 20},
  { id: 'lobby_bottomright_wall',    x: 641,    y: 705,    width: 370, height: 20},
  { id: 'lobby_rightbottom_wall',    x: 1009,    y: 461,    width: 20, height: 220},
  { id: 'lobby_righttop_wall',    x: 1008,    y: 90,    width: 20, height: 220},
  { id: 'lobby_table',    x: 430,    y: 357,    width: 230, height: 85},
  { id: 'lobby_circletable_4',    x: 745,    y: 480,    width: 160, height: 80},
  { id: 'lobby_circletable_3',    x: 188,    y: 480,    width: 160, height: 80},
  { id: 'lobby_circletable_2',    x: 745,    y: 284,    width: 160, height: 95},
  { id: 'lobby_circletable_1',    x: 185,    y: 284,    width: 160, height: 95},
  { id: 'lobby_plant_4',    x: 897,    y: 614,    width: 100, height: 75},
  { id: 'lobby_plant_3',    x: 107,    y: 614,    width: 100, height: 75},
  { id: 'lobby_plant_2',    x: 897,    y: 147,    width: 100, height: 75},
  { id: 'lobby_plant_1',    x: 112,    y: 137,    width: 100, height: 75},
  { id: 'lobby_shelf_2',    x: 655,    y: 110,    width: 175, height: 100},
  { id: 'lobby_shelf_1',    x: 270,    y: 108,    width: 175, height: 100},

  { id: 'corridor_plant_1',    x: 1025,    y: 480,    width: 60, height: 265},
  { id: 'corridor_wall_1',    x: 1591,    y: 607,    width: 20, height: 146},
  { id: 'corridor_wall_2',    x: 1591,    y: 926,    width: 20, height: 146},
  { id: 'corridor_blankspace',    x: 1591,    y: 953,    width: 304, height: 91},
  { id: 'corridor_wall_3',    x: 260,    y: 1026,    width: 425, height: 20},
  { id: 'corridor_wall_3',    x: 304,    y: 989,    width: 192, height: 83},
  { id: 'corridor_wall_4',    x: 88,    y: 1023,    width: 60, height: 20},

  { id: 'lounge_topright_wall',    x: 683,    y: 894,    width: 510, height: 20},
  { id: 'lounge_topleft_wall',    x: 1322,    y: 885,    width: 50, height: 20},
  { id: 'lounge_right_wall',    x: 1355,    y: 887,    width: 20, height: 368},
  { id: 'lounge_rightbottom_wall',    x: 1355,    y: 1358,    width: 20, height: 45},
  { id: 'lounge_rightbottom_wall',    x: 683,    y: 894,    width: 20, height: 514},
  { id: 'lounge_cabinet',    x: 705,    y: 912,    width: 67, height: 80},
  { id: 'lounge_sofa1',    x: 871,    y: 919,    width: 280, height: 60},
  { id: 'lounge_sofa2',    x: 870,    y: 1320,    width: 280, height: 60},
  { id: 'lounge_centretable',    x: 933,    y: 1110,    width: 171, height: 88},
  { id: 'lounge_table',    x: 1261,    y: 1071,    width: 94, height: 160},
  { id: 'lounge_shelf',    x: 704,    y: 1056,    width: 48, height: 242},


  { id: 'meetingroom_lefttop_wall',    x: 1250,    y: 88,    width: 20, height: 220},
  { id: 'meetingroom_leftbottom_wall',    x: 1250,    y: 453,    width: 20, height: 180},
  { id: 'meetingroom_bottom_wall',    x: 1254,    y: 600,    width: 710, height: 20},
  { id: 'meetingroom_cabinet',    x: 1278,    y: 495,    width: 63, height: 100},
  { id: 'meetingroom_table',    x: 1454,    y: 333,    width: 282, height: 120},
  { id: 'meetingroom_plant',    x: 1278,    y: 177,    width: 80, height: 80},


  { id: 'Map_left_wall',    x: 88,    y: 87,    width: 20, height: 1350},
  { id: 'Map_top_wall',    x: 88,    y: 86,    width: 1850, height: 20},
  { id: 'Map_right_wall',    x: 1905,    y: 89,    width: 20, height: 1350},
  { id: 'Map_bottom_wall',    x: 87,    y: 1411,    width: 1850, height: 20},

  { id: 'boundary_top',              x: 0,    y: 0,    width: 2000, height: 8  },
  { id: 'boundary_bottom',           x: 0,    y: 1492, width: 2000, height: 8  },
  { id: 'boundary_left',             x: 0,    y: 0,    width: 8,   height: 1500 },
  { id: 'boundary_right',            x: 1992, y: 0,    width: 8,   height: 1500 },
];

module.exports = { rooms, obstacles };
