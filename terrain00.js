/* Relf Terrain Generator (Javascript version)
 * Creates limitless 3D terrain with various vegetation kinds and scattered objects.
 * Public domain - free to use
 * Copyright (c) Graham Relf, UK, 2026
 * Original Z80 version 1982
 * See also github.com/grelf-net/forest for complete runnable version in Java
 * and up to date PDF documentation showing how this can be used in various ways.
 *
 * This Javascript file defines 3 types: Terrain, Stream and Point.
 * At the start of a program construct one global object of type Terrain:
 *    const T = new Terrain();
 * Then for drawing a map or displaying a scene:
 *    var here = T.terra(x, y);
 * for all (x, y) points you want the map or scene to cover.
 * The returned object, here, has properties for height, vegetation kind, features.
 * Streams flow downhill from ponds if Terrain.withStreams is true. 
 */
'use strict';

const PI1000 = Math.PI * 1000, PI10000 = Math.PI * 10000;

const TERRAINS = { LAKE:20, TOWN:21, GRASS:22, MOOR:23, WOOD:24, THICKET:25, Z:26,
  ROAD:27, MUD:28, PATH:29, STREAM:30, MARSH:31, SNOW:32, QUARRY:33,
  getName:function(t)
  { switch (t)
    {
case this.LAKE: return "Water";
case this.TOWN: return "Paved/town";
case this.GRASS: return "Grass";
case this.MOOR: return "Moor";
case this.WOOD: return "Open wood";
case this.THICKET: return "Thicket";
case this.Z: "Barren";
case this.ROAD: return "Road";
case this.MUD: return "Mud";
case this.PATH: return "Path";
case this.STREAM: return "Stream";
case this.MARSH: return "Marsh";
case this.SNOW: return "Snow";
case this.QUARRY: return "Quarry - DANGER";
default: return "Unknown terrain " + t;
} }};

const FEATURES = { NONE:0, MINE:1, BOULDER:3, ROOT:4, POND:5, KNOLL:6, X:7, CONE:8, T:9,
  getName:function(f)
  { switch (f)
    {
case this.NONE: return "No feature";
case this.MINE: return "Mineshaft";
case this.BOULDER: return "Boulder";
case this.ROOT: return "Rootstock";
case this.POND: return "Pond";
case this.KNOLL: return "Knoll";
case this.X: return "Man-made object";
case this.CONE: return "Cone";
case this.T: return "Phone box";
default: return "Unknown feature " + f;
} }};
// NB: terrain numbers must not be the same as any feature numbers: all used in place()

// Construct one object of type Terrain for your program
function Terrain()
{ this.LAKE_HT0 = this.lakeHt = 204;// Make higher for islands
  this.RECIP128 = 1 / 128;
  this.SNOW_HT0 = 626;
  this.snowHt = 680;
  this.QUARRY_DEPTH = 40;
  this.MIN_QUARRY_HT = this.LAKE_HT0 + 50;//No quarries running into lakes
  this.bleak = false;
  this.woodOnly = false;
  this.withPaths = false;
  this.withStreams = true;
  this.mapMode = true;
  this.placed = {};
  this.roads = [];
  this.PROF = [// You can change this but length must be a power of 2
77,80,84,88,92,96,101,104,108,112,115,118,120,123,126,129,//16 next
131,133,134,134,133,133,131,130,129,126,123,122,122,122,123,125,//32:
126,130,134,137,137,138,138,137,135,133,129,123,118,111,105,101,//48
97,93,90,86,82,78,74,71,69,67,67,67,66,67,69,71,//64
73,74,73,73,71,69,66,62,58,54,52,52,54,55,58,59,//80
62,63,63,65,65,65,66,66,67,69,70,73,77,80,82,85,//96
88,90,93,95,96,96,96,96,93,92,90,85,80,75,71,67,//112
63,60,58,55,52,50,47,44,43,41,40,39,36,35,33,32,//128
30,28,24,20,15,11,7,3,2,2,1,0,1,2,3,6,//144
7,10,11,15,18,22,24,25,25,26,26,25,25,25,25,25,//160
26,28,29,30,33,36,37,39,39,40,40,40,39,39,39,37,//176
37,37,36,36,36,35,35,33,33,32,30,28,25,20,15,11,//192
10,9,9,9,9,11,14,15,17,17,18,18,18,18,18,18,//208
17,17,17,15,14,13,11,11,10,10,10,11,13,14,17,20,//224
22,25,28,30,35,39,41,45,50,58,63,69,73,77,80,82,//240
84,84,85,85,84,84,82,81,80,75,73,71,71,73,74,75,//256
72,74,75,70,69,61,63,56,48,40,38,35,27,29,31,33,//272
34,35,36,35,35,34,32,29,27,26,25,24,21,20,19,17,//288
16,14,12,11,10,9,9,9,11,11,13,14,16,18,19,19,//304
20,21,21,21,22,22,21,22,19,18,15,12,12,12,13,14,//320
16,22,29,37,42,45,49,51,52,55,56,58,58,59,61,62,//336
62,66,66,67,69,70,70,69,69,66,65,60,55,53,51,48,//352
46,47,47,47,47,49,50,48,48,46,43,35,29,21,20,14,//368
12,6,4,4,4,4,4,4,6,14,22,30,40,48,56,60,//384
64,66,70,72,78,80,82,86,87,93,99,106,112,117,121,127,//400
134,143,150,158,166,175,182,188,187,183,182,181,178,174,167,163,//416
156,150,145,139,131,125,122,118,116,114,112,112,111,106,106,103,//432
97,95,89,87,83,82,84,90,95,100,103,105,107,106,106,103,//448
99,95,91,89,89,88,86,88,89,91,94,98,101,104,105,108,110,//464
112,116,121,124,127,128,127,126,124,121,117,114,109,102,96,//480
93,89,85,82,79,77,76,75,72,70,68,65,62,59,55,51,//496
47,43,39,35,32,28,25,31,38,45,52,59,66,68,72,75//512
];//Last entry must be similar to first, with similar slope
  this.PROF_MASK = this.PROF.length - 1;
  
  // The following arrays may also be changed, to get different terrain.
  this.N = 5;// Length of all parameter arrays here
  this.AH = new Array(this.N);
  this.BH = new Array(this.N);
  var CH = [19,13,23,17,15];
  for (var i = 0, a = 0; i < this.N; i++, a += TWO_PI * 0.2)
  { this.AH[i] = Math.round(CH[i] * Math.sin(a));
    this.BH[i] = Math.round(CH[i] * Math.cos(a));
  }
  this.A1 = [-43, -43, -56, 31, 4];
  this.B1 = [-3, -12, 22, 2, 32];
  this.A2 = [-24, -25, 60, 10, - 30];
  this.B2 = [15, -54, -34, -51, -43];
  this.A3 = [-51, -62, -58, -64, 33];
  this.B3 = [-44, 20, 27, -64, -44];
}

// Put an object at given (x, y); test for anything at (x, y); remove object from (x,y)
// (this allows things to move).
Terrain.prototype.place = function(x, y, n) { this.placed[x + ',' + y] = n; };
Terrain.prototype.atPlace = function(x, y) { return this.placed[x + ',' + y]; };
Terrain.prototype.remove = function(x, y) { delete this.placed[x + ',' + y]; };

/* Call terra(x, y) for every point within range around the player, to draw map or scene.
Returns object with 4 or 5 properties:
height (Number), terrain (TERRAINS.Number), feature (FEATURES.Number),
code (String, 2 letters). In a lake there is also depth (Number) */
Terrain.prototype.terra = function(x, y)
{ var i, a, b, feature = FEATURES.NONE, code = "";
  var ht = this.calcHeight(x, y);
  if (ht > this.SNOW_HT0)// Make hill tops more mountainous
  { var dh = ht - this.SNOW_HT0;
    ht = this.SNOW_HT0 + dh * Math.sqrt(dh);
    if (ht > this.snowHt) return {height:ht, terrain:TERRAINS.SNOW, feature:FEATURES.NONE, code:""};
  }
  if (this.bleak)
  { if (this.lakeHt > ht) return {height:this.lakeHt, terrain:TERRAINS.LAKE, 
      depth:this.lakeHt - ht, feature:feature, code:""};
    return {height:ht, terrain:TERRAINS.Z, feature:FEATURES.NONE, code:""};
  }
  if (this.withPaths)
  { if (ht > this.lakeHt && Math.abs(ht - this.calcHeight(x + 4000, y + 2000)) < 2)
      return {height:ht, terrain:TERRAINS.PATH, feature:FEATURES.NONE, code:""};
  }
  var xr = Math.round(x), yr = Math.round(y), xryr = xr * yr;
  var pd = this.placed[xr + ',' + yr];
  if (undefined !== pd)
  { switch (pd)
    {
case TERRAINS.STREAM: if (this.mapMode) break;
case TERRAINS.ROAD:
    return {height:Math.max(ht, this.lakeHt), terrain:pd, feature:FEATURES.NONE, code:""};
case FEATURES.CONE: 
case FEATURES.ROCKET:
case FEATURES.T: feature = pd; break;
  } }
  if (this.lakeHt > ht) return {height:this.lakeHt, terrain:TERRAINS.LAKE, 
      depth:this.lakeHt - ht, feature:feature, code:""};
  if (this.LAKE_HT0 > ht) return {height:ht, terrain:TERRAINS.MUD, feature:feature, code:""};
  if (FEATURES.NONE === feature)
  { var xryr = xr * yr;
    a = this.calcProf(this.B2, xr, this.A3, yr);// NB: Swapped a/b tables
    var f = Math.round(a * xryr * this.RECIP128) & 0xfff;
    if (4 === f) 
    { var xyff = xryr & 0xff;
      if (xyff < 32) feature = FEATURES.MINE;
      else if (xyff < 128) feature = FEATURES.BOULDER;
      else if (xyff < 160)
      { feature = FEATURES.POND;
        if (this.withStreams) new Stream(this, xr, yr);// flow down from here
      }
      else if (xyff < 200) feature = FEATURES.KNOLL;
      else feature = FEATURES.ROOT;
      code = this.getCode(xr, yr);
    }
    else if (8 === f && (Math.round(PI1000 * xryr) & 0xff) < 32)
    { feature = FEATURES.X; code = this.getCode (xr, yr); }
    else if (16 === f && (Math.round(PI10000 * xryr) & 0xff) < 8) feature = FEATURES.CONE;
  }
  if (!this.woodOnly)
  { if (ht > this.SNOW_HT0) return {height:ht, terrain:TERRAINS.MUD, feature:feature, code:code};
    a = this.calcProf(this.A1, x, this.B1, y);
    if (120 > a)
    { if (feature !== FEATURES.T) feature = FEATURES.NONE;// Town can have T only
      return {height:ht, terrain:TERRAINS.TOWN, feature:feature, code:""};
    }//:ZY
    a = this.calcProf(this.A2, x, this.B2, y);
    b = this.calcProf(this.A3, x, this.B3, y);
    if (255 > a)
    { if (255 > b) return {height:ht, terrain:TERRAINS.GRASS, feature:feature, code:code};
      if (77 > a && ht > this.MIN_QUARRY_HT) // Quarry in moor
      { return {height:ht - this.QUARRY_DEPTH, terrain:TERRAINS.QUARRY, feature:FEATURES.NONE, code:""}; }
      return {height:ht, terrain:TERRAINS.MOOR, feature:feature, code:code};
    }
    if (200 > b) return {height:ht, terrain:TERRAINS.THICKET, feature:feature, code:code};
  }
  return {height:ht, terrain:TERRAINS.WOOD, feature:feature, code:code}; // runnable wood
};

Terrain.prototype.calcProf = function(A, x, B, y)
{ var z = 0;
  for (var i = 0; i < this.N; i++)
  { z += this.PROF[Math.floor((A[i] * x + B[i] * y) >> 7) & this.PROF_MASK]; }
  return z;
};

Terrain.prototype.calcHeight = function(x, y)
{ var ht = 0;
  for (var i = 0; i < this.N; i++)
  { var j = (this.AH[i] * x + this.BH[i] * y) * this.RECIP128;
    var jint = Math.floor(j);
    var jfrac = j - jint;
    var prof0 = this.PROF[jint & this.PROF_MASK];
    var prof1 = this.PROF[(jint + 1) & this.PROF_MASK];
    ht += prof0 + jfrac * (prof1 - prof0); // interpolate
  }
  return ht;
};

Terrain.prototype.ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

Terrain.prototype.getCode = function(x, y)// for orienteering flags
{ return this.ALPHABET.charAt(Math.abs(x) % 26) + 
         this.ALPHABET.charAt(Math.abs(y) % 26);
};

/////////////////////////////////////////////////////////////////////

Stream.prototype.RANGE = 5;// Search radius for downhill flow
Stream.prototype.MIN_STREAM_LENGTH = 10;
Stream.prototype.MARSHES = {};
Stream.prototype.putMarsh = function(x, y) { Stream.prototype.MARSHES[x +',' + y] = 1; };
Stream.prototype.isMarsh = function(x, y)
{ return (undefined !== Stream.prototype.MARSHES[x +',' + y]); };

function Stream(terrain, fromX, fromY)
{ var pt = new Point(fromX, fromY);
  this.route = [];
  this.route[0] = pt;
  var ht0 = terrain.terra(pt.x, pt.y).height;
  var flowing = true;
  while (flowing)
  { var htMin = ht0, xMin = pt.x, yMin = pt.y;
    for (var ix = pt.x - this.RANGE; ix <= pt.x + this.RANGE; ix++)
    { for (var iy = pt.y - this.RANGE; iy <= pt.y + this.RANGE; iy++)
      { if (ix !== pt.x && iy !== pt.y)
        { var ht = terrain.terra(ix, iy).height;
          if (ht < htMin) { htMin = ht; xMin = ix; yMin = iy; }
    } } }
    if (htMin < ht0) 
    { pt = new Point(xMin, yMin);
      this.route.push(pt); 
      if (htMin <= terrain.lakeHt) { flowing = false; this.lakeEnd = true; }
      else ht0 = htMin;
    }
    else 
    { flowing = false;
      this.lakeEnd = false;
      if (this.route.length > this.MIN_STREAM_LENGTH)
      { var tt = terrain.terra(pt.x, pt.y).terrain;
        if (tt === TERRAINS.TOWN || tt === TERRAINS.ROAD) return;
        this.marshEnd = true;
        for (ix = pt.x - 4; ix <= pt.x + 4; ix++)
        { for (iy = pt.y - 4; iy <= pt.y + 4; iy++) Stream.prototype.putMarsh(ix, iy);
} } } } }

/*Stream.prototype.draw = function (g2)// on a map
{ if (this.route.length > this.MIN_STREAM_LENGTH)
  { var fm = forest.map;
    g2.strokeStyle = fm.cssBLUE;
    var pt = this.route [1], prevPt = pt;
    var mapPt = fm.mapPt (pt);
    g2.moveTo (mapPt.x, mapPt.y);
    for (var i = 2; i < this.route.length; i++)
    { pt = this.route [i];
      mapPt = fm.mapPt (pt); 
      g2.lineTo (mapPt.x, mapPt.y);
      soakLine (prevPt.x, prevPt.y, pt.x, pt.y); /////////// NB
      prevPt = pt;
    }
    g2.stroke ();
    if (this.marshEnd) fm.plotMarsh (mapPt.x, mapPt.y);
} };*/

// You may want to call this whenever a stream ends
// rather than when drawing a map
function soakLine(terrain, x0, y0, x1, y1)
{ var dx = x1 - x0, dy = y1 - y0;
  var d = Math.sqrt(dx * dx + dy * dy);
  dx = dx / d; dy = dy / d;
  var x = x0, y = y0;
  for (var i = 0; i <= d; i++)
  { soak(terrain, Math.round(x), Math.round(y), 1);
    x += dx; y += dy;
} }

function soak(terrain, x, y, halfWd)
{ for (var iy = y - halfWd; iy <= y + halfWd; iy++)
  { for (var ix = x - halfWd; ix <= x + halfWd; ix++)
    { if (terrain.terra(ix, iy).terrain !== TERRAINS.TOWN)
      { var pd = terrain.atPlace(ix, iy);
        if (pd !== TERRAINS.ROAD) terrain.place(ix, iy, TERRAINS.STREAM);
} } } }

function clearStreams (terrain)
{ var tp = terrain.placed;
  for (var key in tp)
  { if (tp[key] === TERRAINS.STREAM) delete tp[key]; }
}

/////////////////////////////////////////////////////////////////////

function Point(x, y)
{ this.x = x;
  this.y = y;
}

Point.prototype.toString = function()
{ return "(" + this.x + ", " + this.y + ")";
};

Point.prototype.distance = function(otherPt)
{ var dx = this.x - otherPt.x;
  var dy = this.y - otherPt.y;
  return Math.sqrt(dx * dx + dy * dy);
};

//EOF