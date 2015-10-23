///<reference path='./typings/tsd.d.ts'/>
///<reference path="./localTypings/webglutils.d.ts"/>

/*
 * Portions of this code are
 * Copyright 2015, Blair MacIntyre.
 * 
 * Portions of this code taken from http://webglfundamentals.org, at https://github.com/greggman/webgl-fundamentals
 * and are subject to the following license.  In particular, from 
 *    http://webglfundamentals.org/webgl/webgl-less-code-more-fun.html
 *    http://webglfundamentals.org/webgl/resources/primitives.js
 * 
 * Those portions Copyright 2014, Gregg Tavares.
 * All rights reserved.
 */

import loader = require('./loader');
//import textureUtils = require('./textureUtils');
import f3d = require('./f3d');

////////////////////////////////////////////////////////////////////////////////////////////
// stats module by mrdoob (https://github.com/mrdoob/stats.js) to show the performance 
// of your graphics
var stats = new Stats();
stats.setMode( 1 ); // 0: fps, 1: ms, 2: mb

stats.domElement.style.position = 'absolute';
stats.domElement.style.right = '0px';
stats.domElement.style.top = '0px';

document.body.appendChild( stats.domElement );

////////////////////////////////////////////////////////////////////////////////////////////
// utilities
var rand = function(min: number, max?: number) {
  if (max === undefined) {
    max = min;
    min = 0;
  }
  return min + Math.random() * (max - min);
};

var randInt = function(range) {
  return Math.floor(Math.random() * range);
};

////////////////////////////////////////////////////////////////////////////////////////////
// get some of our canvas elements that we need
var canvas = <HTMLCanvasElement>document.getElementById("webgl");  
var filename = <HTMLInputElement>document.getElementById("filename");
var fileSelection = <HTMLSelectElement>document.getElementById("files");
var progressGuage = <HTMLProgressElement>document.getElementById("progress");
progressGuage.style.visibility = "hidden";

////////////////////////////////////////////////////////////////////////////////////////////
// our objects!

// when a new mesh comes in, we will process it on the next frame of the update.
// to tell the update we have a new mesh, set the newObject variable to it's data
var newObject = undefined;

// the current object being displayed
var object = undefined;

////////////////////////////////////////////////////////////////////////////////////////////
// stub's for  callbacks for the model downloader. They don't do much yet
//
// called when the mesh is successfully downloaded
var onLoad = function (mesh: loader.Mesh) {
  progressGuage.value = 100;
  progressGuage.style.visibility = "hidden";
	console.log("got a mesh: " + mesh);
  
  // the vertex array and the triangle array are different lengths.
  // we need to create new arrays that are not nested
  // - position: 3 entries per vertex (x, y, z)
  // - normals: 3 entries per vertex (x, y, z), the normal of the corresponding vertex 
  // - colors: 4 entries per vertex (r, g, b, a), in the range 0-255
  // - indices: 3 entries per triangle, each being an index into the vertex array. 
  var numVerts = mesh.v.length;
  var numTris = mesh.t.length;

  // GOAL: you need to fill in these arrays with the data for the vertices! 
  var position = [];
  var color = [];
  var normal = [];
  // this is where you put the triangle vertex list
  var indices = [];

  //Push values from mesh vertex array onto position, position's done
  for (var i = 0; i < numVerts; i++) {
    for (var j = 0; j < 3; j++) {
      position.push(mesh.v[i][j]);
    }
  }
  
  //Push values from mesh triangle array onto indices, indices is done
 for (var i = 0; i < numTris; i++) {
    for (var j = 0; j < 3; j++) {
      indices.push(mesh.t[i][j]);
    }
  }
  
  //Push 3 random colors and 255 (alpha) for each vertex
 for (var i = 0; i < numVerts; i++) {
    for (var j = 0; j < 3; j++) {
      var c = rand(0, 255)
      color.push(c);
    }
    color.push(255);
  }
  
  //Vertex normals y'all
  
  //The triangle normals
  var tn = [];
  //The vertex normals
  var vn = [];
  
  //Setting up our 2D arrays
  for (var i = 0; i < numTris; i++) {
    tn.push([]); 
  }
  for (var i = 0; i < numVerts; i++) {
    vn.push([]);
  }
  
    for (var i = 0; i < vn.length; i++) {
    vn[i].push(0);
    vn[i].push(0);
    vn[i].push(0);
  }
  
  //Getting triangle normals, by normalizing ab x ac
  for (var i = 0; i < numTris; i++) {
    //Our vertexes
    var a = mesh.t[i][0];
    var b = mesh.t[i][1];
    var c = mesh.t[i][2];
    
    //Getting ab & ac
    var bx = mesh.v[b][0] - mesh.v[a][0];
    var by = mesh.v[b][1] - mesh.v[a][1];
    var bz = mesh.v[b][2] - mesh.v[a][2];
        
    var cx = mesh.v[c][0] - mesh.v[a][0];
    var cy = mesh.v[c][1] - mesh.v[a][1];
    var cz = mesh.v[c][2] - mesh.v[a][2];
  
    //Cross product
    var x = by*cz - cy*bz;
    var y = bz*cx - cz*bx;
    var z = bx*cy - cx*by;
    
    //Normalizing
    var l = Math.sqrt(x*x + y*y + z*z);
    x /= l;
    y /= l;
    z /= l;
    
    //Add to triangle normals array
    tn[i].push(x);
    tn[i].push(y);
    tn[i].push(z);
  }
  
  //Going through the triangle normals and adding them to the vertex normal of the triangle's vertices
  for (i = 0; i < numTris; i++) {
    //Vertices of triangle i
    var a = mesh.t[i][0];
    var b = mesh.t[i][1];
    var c = mesh.t[i][2];
    
    vn[a][0] += tn[i][0];
    vn[a][1] += tn[i][1];
    vn[a][2] += tn[i][2];
    
    vn[b][0] += tn[i][0];
    vn[b][1] += tn[i][1];
    vn[b][2] += tn[i][2];
    
    vn[c][0] += tn[i][0];
    vn[c][1] += tn[i][1];
    vn[c][2] += tn[i][2];
  }
  
  //Normalizing our vertex normals
  for (i = 0; i < vn.length; i++) {
    var normx = vn[i][0];
    var normy = vn[i][1];
    var normz = vn[i][2];
    
    var l = Math.sqrt(normx*normx + normy*normy + normz*normz);
    vn[i][0] = normx/l;
    vn[i][1] = normy/l;
    vn[i][2] = normz/l;
  }
  
  //Push the vertex normals onto normal
  for (i = 0; i < numVerts; i++) {
    for (j = 0; j < 3; j++) {
      normal.push(vn[i][j]);
    }
  }
  
  // bb1 and bb2 are the corners of the bounding box of the object.  
  var bb1 = vec3.create();
  var bb2 = vec3.create();
  
  bb1[0] = mesh.v[0][0];
  bb1[1] = mesh.v[0][1];
  bb1[2] = mesh.v[0][2];
  
  bb2[0] = mesh.v[0][0];
  bb2[1] = mesh.v[0][1];
  bb2[2] = mesh.v[0][2];
  //Loop through, make sure bb1 has the smallest coordinates and bb2 has the largest coordinates
  //out of all vertex coordinates
  for (i = 0; i < numVerts; i++) {
    bb1[0] = Math.min(bb1[0], mesh.v[i][0]);
    bb1[1] = Math.min(bb1[1], mesh.v[i][1]);
    bb1[2] = Math.min(bb1[2], mesh.v[i][2]);
    
    bb2[0] = Math.max(bb2[0], mesh.v[i][0]);
    bb2[1] = Math.max(bb2[1], mesh.v[i][1]);
    bb2[2] = Math.max(bb2[2], mesh.v[i][2]);
  }
  
  //Get the center as the midpoint of bb1->bb2
  var cx = (bb2[0] + bb1[0])/2;
  var cy = (bb2[1] + bb1[1])/2;
  var cz = (bb2[2] + bb1[2])/2;
  
  // Setup the new object.  you can add more data to this object if you like
  // to help with subdivision (for example)
  newObject = {
    boundingBox: [bb1, bb2],
    scaleFactor: 300/vec3.distance(bb1,bb2),
    center: [cx, cy, cz],  
    numElements: indices.length,
    arrays: {
      position: new Float32Array(position),
      normal: new Float32Array(normal),
      color: new Uint8Array(color),
      indices: new Uint16Array(indices)
    }
  };
}

// called periodically during download.  Some servers set the file size so 
// progres.lengthComputable is true, which lets us compute the progress
var onProgress = function (progress: ProgressEvent) {
  if (progress.lengthComputable) {
    progressGuage.value = progress.loaded / progress.total * 100;
  }
	console.log("loading: " + progress.loaded + " of " + progress.total +  "...");
}

// of there's an error, this will be called.  We'll log it to the console
var onError = function (error: ErrorEvent) {
	console.log("error! " + error);
}

// HTML dom element callback functions.  Putting them on the window object makes 
// them visible to the DOM elements
window["jsonFileChanged"] = () => {
   // we stored the filename in the select option items value property 
   filename.value = fileSelection.value;
}

window["loadModel"] = () => {
    // reset and show the progress bar
    progressGuage.max = 100;
    progressGuage.value = 0;
    progressGuage.style.visibility = "visible";
    
    // attempt to download the modele
    loader.loadMesh("models/" + filename.value, onLoad, onProgress, onError);
}

window["onSubdivide"] = () => {
  //Corner operators
  function t(c: number): number {
    return Math.floor(c/3)
  }
  
  function n(c: number): number {
    return 3*t(c)+(c+1)%3;
  }
  
  function p(c: number): number {
    return n(n(c));
  }
  
  function b(c: number, o: Array<number>): boolean {
    return o[c] == c;
  }
  
  function l(c: number, o: Array<number>): number {
    return o[n(c)];
  }
  
  function r(c: number, o: Array<number>): number {
    return o[p(c)];
  }
  
  //Midpoint function for bulge 
  function midpoint(ax: number, ay: number, az: number, bx:number, by:number, bz:number): Array<number> {
    var ret = [];
    ret[0] = (ax + bx)/2;
    ret[1] = (ay+by)/2;
    ret[2] = (az+bz)/2;
    return ret;
  }
  //New arrays for the newObject
    var position = [];
    var normal = [];
    var color = [];
    var indices = [];
    
    //Move all the positions to a new array
    for (var i = 0; i < object.arrays.position.length; i++) {
      position.push(object.arrays.position[i]);
    }
    //Move all the indices to a new array
     for (var i = 0; i < object.arrays.indices.length; i++) {
      indices.push(object.arrays.indices[i]);
    }
    //Set up the o table. If a corner has no opposite, o[i] = i, so initialize values as such
    var o = [];
    for (var i = 0; i < object.arrays.indices.length; i++) {
      o[i] = i;
    }
    //Filling in the o table
    for (var i = 0; i < object.arrays.indices.length; i++) {
      for (var j = i + 1; j < object.arrays.indices.length; j++) {
          if (indices[n(i)] == indices[p(j)] && indices[p(i)] == indices[n(j)]) {
            o[i] = j;
            o[j] = i;
          }
      }
    }
    //Subdivision, using pseudocode from slides
    var w = [];
    var nv = position.length / 3;
    var nc = indices.length;
    var nt = nc/3;
    //splitEdges
    for (var i = 0; i < nc; i++) {
      if (b(i, o)) {
        var pr = 3*indices[p(i)];
        var nx = 3*indices[n(i)];
        var mx = (position[pr] + position[nx])/2;
        var my = (position[pr+1] + position[nx+1])/2;
        var mz = (position[pr+2] + position[nx+2])/2;
        position.push(mx);
        position.push(my);
        position.push(mz)
        w[i] = nv++;
      }
      else if (i < o[i]) {
        var pr = 3*indices[p(i)];
        var nx = 3*indices[n(i)];
        var mx = (position[pr] + position[nx])/2;
        var my = (position[pr+1] + position[nx+1])/2;
        var mz = (position[pr+2] + position[nx+2])/2;
        position.push(mx);
        position.push(my);
        position.push(mz);
        w[o[i]] = nv;
        w[i] = nv++;
      }
    }
    //bulge
    for (var i = 0; i < nc; i++) {
      if (!b(i, o) && (i < o[i])) {
        if (!b(p(i),o) && !b(n(i),o) && !b(p(o[i]),o) && !b(n(o[i]), o)) {
          var ri = 3*indices[r(i, o)];
          var li = 3*indices[l(i, o)];
          var roi = 3*indices[r(o[i], o)];
          var loi = 3*indices[l(o[i], o)];
          var ii = 3*indices[i]
          var oi = 3*indices[o[i]];
          var ovec = midpoint(position[roi], position[roi+1], position[roi+2], position[loi], position[loi+1], position[loi+2]);
          var ivec = midpoint(position[ri], position[ri+1], position[ri+2], position[li], position[li+1], position[li+2]);
          var iomp = midpoint(position[ii], position[ii+1], position[ii+2], position[oi], position[oi+1], position[oi+2]);
          var midp = midpoint(ovec[0], ovec[1], ovec[2], ivec[0], ivec[1], ivec[2]);
          var resx = 0.25*(iomp[0] - midp[0]);
          var resy = 0.25*(iomp[1] - midp[1]);
          var resz = 0.25*(iomp[2] - midp[2]);
          position[3*w[i]] += resx;
          position[3*w[i]+1] += resy;
          position[3*w[i]+2] += resz;
        }
      }
    }
    //splitTriangles
    for (var i = 0; i < 3*nt; i += 3) {
      indices[3*nt+i] = indices[i];
      indices[n(3*nt+i)] = w[p(i)];
      indices[p(3*nt+i)] = w[n(i)];
      
      indices[6*nt+i] = indices[n(i)];
      indices[n(6*nt+i)] = w[i];
      indices[p(6*nt+i)] = w[p(i)];
      
      indices[9*nt+i] = indices[p(i)];
      indices[n(9*nt+i)] = w[n(i)];
      indices[p(9*nt+i)] = w[i];
      
      indices[i] = w[i];
      indices[n(i)] = w[n(i)];
      indices[p(i)] = w[p(i)];
    }
      nt *= 4;
      nc = 3*nt; 
  
  //Computing normals, round 2. Same as above, but slightly edited to use
  //indices & position arrays instead of vertex & triangle arrays  
  var tn = [];
  var vn = [];
  
  for (var i = 0; i < nt; i++) {
    tn.push([]); 
  }
  for (var i = 0; i < nv; i++) {
    vn.push([]);
  }
  
  for (var i = 0; i < vn.length; i++) {
    vn[i].push(0);
    vn[i].push(0);
    vn[i].push(0);
  }

  for (var i = 0; i < nt; i++) {
    var ai = indices[3*i];
    var bi = indices[3*i+1];
    var ci = indices[3*i+2];
    
    ai *= 3;
    bi *= 3;
    ci *= 3;
    
    var bx = position[bi] - position[ai];
    var by = position[bi + 1] - position[ai + 1];
    var bz = position[bi + 2] - position[ai + 2];
        
    var cx = position[ci] - position[ai];
    var cy = position[ci + 1] - position[ai + 1];
    var cz = position[ci + 2] - position[ai + 2];
  
    var x = by*cz - cy*bz;
    var y = bz*cx - cz*bx;
    var z = bx*cy - cx*by;
    
    var len = Math.sqrt(x*x + y*y + z*z);
    x /= len;
    y /= len;
    z /= len;
    
    tn[i].push(x);
    tn[i].push(y);
    tn[i].push(z);
  }
  
  for (i = 0; i < nt; i++) {
    var ai = indices[3*i];
    var bi = indices[3*i+1];
    var ci = indices[3*i+2];
    
    vn[ai][0] += tn[i][0];
    vn[ai][1] += tn[i][1];
    vn[ai][2] += tn[i][2];
    
    vn[bi][0] += tn[i][0];
    vn[bi][1] += tn[i][1];
    vn[bi][2] += tn[i][2];
    
    vn[ci][0] += tn[i][0];
    vn[ci][1] += tn[i][1];
    vn[ci][2] += tn[i][2];
  }
  
  for (i = 0; i < vn.length; i++) {
    var normx = vn[i][0];
    var normy = vn[i][1];
    var normz = vn[i][2];
    
    var len = Math.sqrt(normx*normx + normy*normy + normz*normz);
    vn[i][0] = normx/len;
    vn[i][1] = normy/len;
    vn[i][2] = normz/len;
  }

  //Put vertex normals in normal array
  for (i = 0; i < vn.length; i++) {
    for (j = 0; j < 3; j++) {
      normal.push(vn[i][j]);
    }
  }
  
  //Make new colors
  for (var i = 0; i < nv; i++) {
      color.push(rand(0, 255));
      color.push(rand(0, 255));
      color.push(rand(0, 255));
      color.push(255);
    }
  
  //Make the newObject
    newObject = {
    boundingBox: object.boundingBox,
    scaleFactor: object.scaleFactor,
    center: object.center,  
    numElements: nc,
    arrays: {
      position: new Float32Array(position),
      normal: new Float32Array(normal),
      color: new Uint8Array(color),
      indices: new Uint16Array(indices)
    }
  };
} 

////////////////////////////////////////////////////////////////////////////////////////////
// some simple interaction using the mouse.
// we are going to get small motion offsets of the mouse, and use these to rotate the object
//
// our offset() function from assignment 0, to give us a good mouse position in the canvas 
function offset(e: MouseEvent): GLM.IArray {
    e = e || <MouseEvent> window.event;

    var target = <Element> e.target || e.srcElement,
        rect = target.getBoundingClientRect(),
        offsetX = e.clientX - rect.left,
        offsetY = e.clientY - rect.top;

    return vec2.fromValues(offsetX, offsetY);
}

var mouseStart = undefined;  // previous mouse position
var mouseDelta = undefined;  // the amount the mouse has moved
var mouseAngles = vec2.create();  // angle offset corresponding to mouse movement

// start things off with a down press
canvas.onmousedown = (ev: MouseEvent) => {
    mouseStart = offset(ev);        
    mouseDelta = vec2.create();  // initialize to 0,0
    vec2.set(mouseAngles, 0, 0);
}

// stop things with a mouse release
canvas.onmouseup = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
        const clickEnd = offset(ev);
        vec2.sub(mouseDelta, clickEnd, mouseStart);        // delta = end - start
        vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);  

        // now toss the two values since the mouse is up
        mouseDelta = undefined;
        mouseStart = undefined; 
    }
}

// if we're moving and the mouse is down        
canvas.onmousemove = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      const m = offset(ev);
      vec2.sub(mouseDelta, m, mouseStart);    // delta = mouse - start 
      vec2.copy(mouseStart, m);               // start becomes current position
      vec2.scale(mouseAngles, mouseDelta, 10/canvas.height);

      // console.log("mousemove mouseAngles: " + mouseAngles[0] + ", " + mouseAngles[1]);
      // console.log("mousemove mouseDelta: " + mouseDelta[0] + ", " + mouseDelta[1]);
      // console.log("mousemove mouseStart: " + mouseStart[0] + ", " + mouseStart[1]);
   }
}

// stop things if you move out of the window
canvas.onmouseout = (ev: MouseEvent) => {
    if (mouseStart != undefined) {
      vec2.set(mouseAngles, 0, 0);
      mouseDelta = undefined;
      mouseStart = undefined;
    }
}

////////////////////////////////////////////////////////////////////////////////////////////
// start things off by calling initWebGL
initWebGL();

function initWebGL() {
  // get the rendering context for webGL
  var gl: WebGLRenderingContext = getWebGLContext(canvas);
  if (!gl) {
    return;  // no webgl!  Bye bye
  }

  // turn on backface culling and zbuffering
  gl.enable(gl.CULL_FACE);
  gl.enable(gl.DEPTH_TEST);

  // attempt to download and set up our GLSL shaders.  When they download, processed to the next step
  // of our program, the "main" routing
  loader.loadFiles(['shaders/a3-shader.vert', 'shaders/a3-shader.frag'], function (shaderText) {
    var program = createProgramFromSources(gl, shaderText);
    main(gl, program);
  }, function (url) {
      alert('Shader failed to download "' + url + '"');
  }); 
}

////////////////////////////////////////////////////////////////////////////////////////////
// webGL is set up, and our Shader program has been created.  Finish setting up our webGL application       
function main(gl: WebGLRenderingContext, program: WebGLProgram) {
  
  // use the webgl-utils library to create setters for all the uniforms and attributes in our shaders.
  // It enumerates all of the uniforms and attributes in the program, and creates utility functions to 
  // allow "setUniforms" and "setAttributes" (below) to set the shader variables from a javascript object. 
  // The objects have a key for each uniform or attribute, and a value containing the parameters for the
  // setter function
  var uniformSetters = createUniformSetters(gl, program);
  var attribSetters  = createAttributeSetters(gl, program);

  /// ***************
  /// This code creates the initial 3D "F".  You can look here for guidance on what some of the elements
  /// of the "object" are, and may want to use the debugger to look at the content of the fields of the "arrays" 
  /// object returned from f3d.createArrays(gl) 
  var arrays = f3d.createArrays(gl);
  var bb1 = vec3.fromValues(100, 150, 30);
  var bb2 = vec3.fromValues(0, 0, 0);
  object = {
    boundingBox: [bb2,bb1],
    scaleFactor: 300/vec3.distance(bb1,bb2), 
    center: [50, 75, 15],
    numElements: arrays.indices.length,
    arrays: arrays 
  }
  
  var buffers = {
    position: gl.createBuffer(),
    //texcoord: gl.createBuffer(),
    normal: gl.createBuffer(),
    color: gl.createBuffer(),
    indices: gl.createBuffer()
  };
  object.buffers = buffers;
      
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
  gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);
  //gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
  //gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
  gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
  gl.bufferData(gl.ARRAY_BUFFER, arrays.color, gl.STATIC_DRAW);
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);
  
  var attribs = {
    a_position: { buffer: buffers.position, numComponents: 3, },
    a_normal:   { buffer: buffers.normal,   numComponents: 3, },
    //a_texcoord: { buffer: buffers.texcoord, numComponents: 2, },
    a_color:    { buffer: buffers.color,    numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true  }
  };

  /// you will need to set up your arrays and then create your buffers
  /// ********************
  
  
  function degToRad(d) {
    return d * Math.PI / 180;
  }

  var cameraAngleRadians = degToRad(0);
  var fieldOfViewRadians = degToRad(60);
  var cameraHeight = 50;

  var uniformsThatAreTheSameForAllObjects = {
    u_lightWorldPos:         [50, 30, -100],
    u_viewInverse:           mat4.create(),
    u_lightColor:            [1, 1, 1, 1],
    u_ambient:               [0.1, 0.1, 0.1, 0.1]
  };

  var uniformsThatAreComputedForEachObject = {
    u_worldViewProjection:   mat4.create(),
    u_world:                 mat4.create(),
    u_worldInverseTranspose: mat4.create(),
  };

  // var textures = [
  //   textureUtils.makeStripeTexture(gl, { color1: "#FFF", color2: "#CCC", }),
  //   textureUtils.makeCheckerTexture(gl, { color1: "#FFF", color2: "#CCC", }),
  //   textureUtils.makeCircleTexture(gl, { color1: "#FFF", color2: "#CCC", }),
  // ];

  var baseColor = rand(240);
  var objectState = { 
      materialUniforms: {
        u_colorMult:             chroma.hsv(rand(baseColor, baseColor + 120), 0.5, 1).gl(),
        //u_diffuse:               textures[randInt(textures.length)],
        u_specular:              [1, 1, 1, 1],
        u_shininess:             450,
        u_specularFactor:        0.75,
      }
  };

  // some variables we'll reuse below
  var projectionMatrix = mat4.create();
  var viewMatrix = mat4.create();
  var rotationMatrix = mat4.create();
  var matrix = mat4.create();  // a scratch matrix
  var invMatrix = mat4.create();
  var axisVector = vec3.create();
  
  requestAnimationFrame(drawScene);

  // Draw the scene.
  function drawScene(time: number) {
    time *= 0.001; 

    // reset the object if a new one has been loaded
    if (newObject) {
      object = newObject;
      newObject = undefined;
      
      arrays = object.arrays;
      buffers = {
        position: gl.createBuffer(),
        //texcoord: gl.createBuffer(),
        normal: gl.createBuffer(),
        color: gl.createBuffer(),
        indices: gl.createBuffer()
      };
      object.buffers = buffers;
      
      // For each of the new buffers, load the array data into it. 
      // first, bindBuffer sets it as the "current Buffer" and then "bufferData"
      // loads the data into it.  Each array (vertex, color, normal, texture coordinates)
      // has the same number of entries, and is used together by the shaders when it's
      // index is referenced by the index array for the triangle list
      
      // vertex positions
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.position);
      gl.bufferData(gl.ARRAY_BUFFER, arrays.position, gl.STATIC_DRAW);

      // texture coordinates
      //gl.bindBuffer(gl.ARRAY_BUFFER, buffers.texcoord);
      //gl.bufferData(gl.ARRAY_BUFFER, arrays.texcoord, gl.STATIC_DRAW);

      // vertex normals
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.normal);
      gl.bufferData(gl.ARRAY_BUFFER, arrays.normal, gl.STATIC_DRAW);

      // vertex colors
      gl.bindBuffer(gl.ARRAY_BUFFER, buffers.color);
      gl.bufferData(gl.ARRAY_BUFFER, arrays.color, gl.STATIC_DRAW);

      // triangle indices.  
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, arrays.indices, gl.STATIC_DRAW);

      // the attribute data to be used by the "setAttributes" utility function
      attribs = {
        a_position: { buffer: buffers.position, numComponents: 3, },
        a_normal:   { buffer: buffers.normal,   numComponents: 3, },
        //a_texcoord: { buffer: buffers.texcoord, numComponents: 2, },
        a_color:    { buffer: buffers.color,    numComponents: 4, type: gl.UNSIGNED_BYTE, normalize: true  }
      }; 
      
      // reset the rotation matrix
      rotationMatrix = mat4.identity(rotationMatrix);     
    }    
   
    // measure time taken for the little stats meter
    stats.begin();

    // if the window changed size, reset the WebGL canvas size to match.  The displayed size of the canvas
    // (determined by window size, layout, and your CSS) is separate from the size of the WebGL render buffers, 
    // which you can control by setting canvas.width and canvas.height
    resizeCanvasToDisplaySize(canvas);

    // Set the viewport to match the canvas
    gl.viewport(0, 0, canvas.width, canvas.height);
    
    // Clear the canvas AND the depth buffer.
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

    // Compute the projection matrix
    var aspect = canvas.clientWidth / canvas.clientHeight;
    mat4.perspective(projectionMatrix,fieldOfViewRadians, aspect, 1, 2000);

    // Compute the camera's matrix using look at.
    var cameraPosition = [0, 0, -200];
    var target = [0, 0, 0];
    var up = [0, 1, 0];
    var cameraMatrix = mat4.lookAt(uniformsThatAreTheSameForAllObjects.u_viewInverse, cameraPosition, target, up);

    // Make a view matrix from the camera matrix.
    mat4.invert(viewMatrix, cameraMatrix);
    
    // tell WebGL to use our shader program.  probably don't need to do this each time, since we aren't
    // changing it, but it doesn't hurt in this simple example.
    gl.useProgram(program);
    
    // Setup all the needed attributes.   This utility function does the following for each attribute, 
    // where "index" is the index of the shader attribute found by "createAttributeSetters" above, and
    // "b" is the value of the entry in the "attribs" array cooresponding to the shader attribute name:
    //   gl.bindBuffer(gl.ARRAY_BUFFER, b.buffer);
    //   gl.enableVertexAttribArray(index);
    //   gl.vertexAttribPointer(
    //     index, b.numComponents || b.size, b.type || gl.FLOAT, b.normalize || false, b.stride || 0, b.offset || 0);    
    setAttributes(attribSetters, attribs);

    // Bind the indices for use in the index-based drawElements below
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffers.indices);

    // Set the uniforms that are the same for all objects.  Unlike the attributes, each uniform setter
    // is different, depending on the type of the uniform variable.  Look in webgl-util.js for the
    // implementation of  setUniforms to see the details for specific types       
    setUniforms(uniformSetters, uniformsThatAreTheSameForAllObjects);
   
    ///////////////////////////////////////////////////////
    // Compute the view matrix and corresponding other matrices for rendering.
    
    // first make a copy of our rotationMatrix
    mat4.copy(matrix, rotationMatrix);
    
    // adjust the rotation based on mouse activity.  mouseAngles is set if user is dragging 
    if (mouseAngles[0] !== 0 || mouseAngles[1] !== 0) {
      // need an inverse world transform so we can find out what the world X axis for our first rotation is
      mat4.invert(invMatrix, matrix);
      // get the world X axis
      var xAxis = vec3.transformMat4(axisVector, vec3.fromValues(1,0,0), invMatrix);

      // rotate about the world X axis (the X parallel to the screen!)
      mat4.rotate(matrix, matrix, -mouseAngles[1], xAxis);
      
      // now get the inverse world transform so we can find the world Y axis
      mat4.invert(invMatrix, matrix);
      // get the world Y axis
      var yAxis = vec3.transformMat4(axisVector, vec3.fromValues(0,1,0), invMatrix);

      // rotate about teh world Y axis
      mat4.rotate(matrix, matrix, mouseAngles[0], yAxis);
  
      // save the resulting matrix back to the cumulative rotation matrix 
      mat4.copy(rotationMatrix, matrix);
      vec2.set(mouseAngles, 0, 0);        
    }   

    // add a translate and scale to the object World xform, so we have:  R * T * S
    mat4.translate(matrix, rotationMatrix, [-object.center[0]*object.scaleFactor, -object.center[1]*object.scaleFactor, 
                                            -object.center[2]*object.scaleFactor]);
    mat4.scale(matrix, matrix, [object.scaleFactor, object.scaleFactor, object.scaleFactor]);
    mat4.copy(uniformsThatAreComputedForEachObject.u_world, matrix);
    
    // get proj * view * world
    mat4.multiply(matrix, viewMatrix, uniformsThatAreComputedForEachObject.u_world);
    mat4.multiply(uniformsThatAreComputedForEachObject.u_worldViewProjection, projectionMatrix, matrix);

    // get worldInvTranspose.  For an explaination of why we need this, for fixing the normals, see
    // http://www.unknownroad.com/rtfm/graphics/rt_normals.html
    mat4.transpose(uniformsThatAreComputedForEachObject.u_worldInverseTranspose, 
                   mat4.invert(matrix, uniformsThatAreComputedForEachObject.u_world));

    // Set the uniforms we just computed
    setUniforms(uniformSetters, uniformsThatAreComputedForEachObject);

    // Set the uniforms that are specific to the this object.
    setUniforms(uniformSetters, objectState.materialUniforms);

    // Draw the geometry.   Everything is keyed to the ""
    gl.drawElements(gl.TRIANGLES, object.numElements, gl.UNSIGNED_SHORT, 0);

    // stats meter
    stats.end();

    requestAnimationFrame(drawScene);
  }
}

