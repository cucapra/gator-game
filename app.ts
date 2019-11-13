// import * as OBJ from 'webgl-obj-loader';
import {mat4, vec3} from 'gl-matrix';
import {mat3} from 'gl-matrix';
import * as teapot from 'teapot';
import pack from 'array-pack-2d';
import * as normals from 'normals';
import * as obj_loader from 'webgl-obj-loader';
// import { OBJ } from 'webgl-obj-loader';
export type Vec3Array = [number, number, number][];

import {readFileSync} from 'fs';

// var fs = require("fs");
var __dirname : string;



import key from 'key-pressed';
import attach from 'mouse-position';
import pressed from 'mouse-pressed';

// import * as parseWFObj from 'wavefront-obj-parser';

// var parseWFObj = require('wavefront-obj-parser');

// WebGL context
var gl;
// the canvas element
var canvas = null;
// main shader program
var shaderProgram = null;
// main app object

let matStack: mat4[] = [];


let app = {lastTime: 0,
     elapsed: 0,
    timeNow: 0, meshes: {}, models: {}, mvMatrix: mat4.create(), mvMatrixStack: matStack, pMatrix: mat4.create(), cMatrix: mat4.create()};


// app.meshes = {};
// app.models = {};
// app.mvMatrix = mat4.create();
// app.mvMatrixStack = [];
// app.pMatrix = mat4.create();
// app.cMatrix = mat4.create(); //Camera matrix


// app.meshes = {};
// app.models = {};
// app.mvMatrix = mat4.create();
// app.mvMatrixStack = [];
// app.pMatrix = mat4.create();

mat4.translate(app.cMatrix, app.cMatrix, [0, 0, 15]); //Move backwards initially to see object

// let key : (s : String) => String = require('key-pressed');
//For getting mouse position and button press
let mpos;

let mbut; 


// Pan and move speed
var panspeed = 2;
var movespeed = 1;

// window.requestAnimFrame = (function (){
//     return window.requestAnimationFrame ||
//         window.webkitRequestAnimationFrame ||
//         window.mozRequestAnimationFrame ||
//         window.oRequestAnimationFrame ||
//         window.msRequestAnimationFrame ||
//         function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element){
//             return window.setTimeout(callback, 1000 / 60);
//         };
// })();


function make_buffer(gl: WebGLRenderingContext, data: number[][], type: 'uint8' | 'uint16' | 'float32', mode: number): WebGLBuffer {
    // Initialize a buffer.
    let buf = gl.createBuffer();
    if (!buf) {
      throw "could not create WebGL buffer";
    }
  
    // Flatten the data to a packed array.
    let arr = pack(data, type);
  
    // Insert the data into the buffer.
    gl.bindBuffer(mode, buf);
    gl.bufferData(mode, arr, gl.STATIC_DRAW);
  
    return buf;
  }

  function gl_buffer(gl: WebGLRenderingContext, mode: number, data: Float32Array | Uint16Array) {
    let buf = gl.createBuffer();
    if (!buf) {
      throw "could not create WebGL buffer";
    }
    gl.bindBuffer(mode, buf);
    gl.bufferData(mode, data, gl.STATIC_DRAW);
    return buf;
  }

  /**
 * Contains buffers for a single 3D object model.
 */
export interface Mesh {
    /**
     * A 3-dimensional uint16 element array buffer.
     */
    cells: WebGLBuffer;
  
    /**
     * The total number of numbers in the cell buffer.
     */
    cell_count: number;
  
    /**
     * A 3-dimensional float32 array buffer.
     */
    positions: WebGLBuffer;
  
    /**
     * Also a 3-dimensional float32 array buffer.
     */
    normals: WebGLBuffer;
  
    /**
     * 2-Dimensional float32 array buffer.
     */
    texcoords: WebGLBuffer;
  }

  
  function group_array<T>(a: T[], size: number) {
    let out: T[][] = [];
    for (let i = 0; i < a.length; i += size) {
      out.push(a.slice(i, i + size));
    }
    return out;
  }

  /**
 * Load a mesh from an OBJ file.
 *
 * [Reference] : https://github.com/cucapra/braid/
 * @param gl      rendering context
 * @param obj_src string literal content of OBJ source file
 */
export function load_obj(gl: WebGLRenderingContext, obj_src: String): Mesh {

    if (typeof obj_src !== "string") {
      throw "obj source must be a string";
    }
  
    // // Create a WebGL buffer.
    let mesh = new obj_loader.Mesh(obj_src);
    // Match the interface we're using for Mesh objects that come from
    // StackGL.
    let cell = group_array(mesh.indices, 3) as Vec3Array;
    let position = group_array(mesh.vertices, 3) as Vec3Array;
    // let normal = normals.vertexNormals(cell, position);
    let normal = group_array(mesh.vertexNormals, 3) as Vec3Array;
    let out: Mesh = {
      positions: make_buffer(gl, position, 'float32', gl.ARRAY_BUFFER),
      cells: make_buffer(gl, cell, 'uint16', gl.ELEMENT_ARRAY_BUFFER),
      normals: make_buffer(gl, normal, 'float32', gl.ARRAY_BUFFER),
      cell_count: cell.length * cell[0].length,
      // This name I invented -- it's not in the StackGL models.
      texcoords: gl_buffer(gl, gl.ARRAY_BUFFER, new Float32Array(mesh.textures))
    };
  
    // .obj files can have normals, but if they don't, this parser library
    // (confusingly) fills the array with NaN.
    // if (!isNaN(mesh.vertexNormals[0])) {
    //   out.normals = group_array(mesh.vertexNormals, 3) as Vec3Array;
    // }
  
    return out;
  }

export function initWebGL(canvas: HTMLCanvasElement): WebGLRenderingContext{
    try {
        // Try to grab the standard context. If it fails, fallback to experimental.
        gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    }
    catch (e){
    }
    if (!gl){
        alert("Unable to initialize WebGL. Your browser may not support it.");
        gl = null;
    }
    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;
    gl.viewport(0, 0, canvas.width, canvas.height);
    return gl;
}


function getShader(gl, id){
    // Refers to external HTML
    var shaderScript = document.getElementById(id);
    if (!shaderScript){
        return null;
    }

    var str = "";
    var k = shaderScript.firstChild;
    while (k){
        if (k.nodeType == 3){
            str += k.textContent;
        }
        k = k.nextSibling;
    }

    var shader;

    if (id == "shader-fs"){
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (id == "shader-vs"){
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else{
        return null;
    }

    gl.shaderSource(shader, str);
    gl.compileShader(shader);

  

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)){
        alert(gl.getShaderInfoLog(shader));
        return null;
    }

    return shader;
}

function initShaders(){
    var fragmentShader = getShader(gl, "shader-fs");
    var vertexShader = getShader(gl, "shader-vs");

    shaderProgram = gl.createProgram();
    gl.attachShader(shaderProgram, vertexShader);
    gl.attachShader(shaderProgram, fragmentShader);
    gl.linkProgram(shaderProgram);

    if (!gl.getProgramParameter(shaderProgram, gl.LINK_STATUS)){
        alert("Could not initialise shaders");
    }
    gl.useProgram(shaderProgram);

    shaderProgram.vertexPositionAttribute = gl.getAttribLocation(shaderProgram, "aVertexPosition");
    gl.enableVertexAttribArray(shaderProgram.vertexPositionAttribute);

    shaderProgram.vertexNormalAttribute = gl.getAttribLocation(shaderProgram, "aVertexNormal");
    gl.enableVertexAttribArray(shaderProgram.vertexNormalAttribute);

    shaderProgram.textureCoordAttribute = gl.getAttribLocation(shaderProgram, "aTextureCoord");
    gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);

    shaderProgram.pMatrixUniform = gl.getUniformLocation(shaderProgram, "uPMatrix");
    shaderProgram.mvMatrixUniform = gl.getUniformLocation(shaderProgram, "uMVMatrix");
    shaderProgram.nMatrixUniform = gl.getUniformLocation(shaderProgram, "uNMatrix");
}

function drawObject(mesh : Mesh): void{
    /*
     Takes in a model that points to a mesh and draws the object on the scene.
     Assumes that the setMatrixUniforms function exists
     as well as the shaderProgram has a uniform attribute called "samplerUniform"
     */
    
   gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.positions);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, mesh.normals);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, 3, gl.FLOAT, false, 0, 0);

    if (mesh.texcoords){
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, mesh.texcoords);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
    }
    else{
        gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, mesh.cells);

    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, mesh.cell_count, gl.UNSIGNED_SHORT, 0);
}


function mvPushMatrix(){
    var copy = mat4.create();
    mat4.copy(copy, app.mvMatrix);
    app.mvMatrixStack.push(copy);
}

function mvPopMatrix(){
    if (app.mvMatrixStack.length == 0){
        throw "Invalid popMatrix!";
    }
    app.mvMatrix = app.mvMatrixStack.pop();
}

function setMatrixUniforms(){
    // From: http://voxelent.com/html/beginners-guide/chapter_4/ch4_ModelView.html
    mat4.invert(app.mvMatrix, app.cMatrix);      //Obtain Model-View matrix from Camera Matrix
    
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, app.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, app.mvMatrix);

    var normalMatrix = mat3.create();
    mat3.fromMat4(normalMatrix, app.mvMatrix);
    mat3.invert(normalMatrix, normalMatrix);
    mat3.transpose(normalMatrix, normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}


function animate(){
    app.timeNow = new Date().getTime();
    app.elapsed = app.timeNow - app.lastTime;
    if (app.lastTime != 0){
        mat4.rotateZ(app.mvMatrix, app.mvMatrix, .01);
    }
    app.lastTime = app.timeNow;
}

function drawScene(){

    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    
    mat4.perspective(app.pMatrix, 45, gl.viewportWidth / gl.viewportHeight, 0.01, 1000.0);

    // move the camera
  
    var W = key('W');
    if(W){
        mat4.translate(app.cMatrix, app.cMatrix, [0,0,-movespeed]);
    }
    var A = key('A');
    if(A){
        mat4.translate(app.cMatrix, app.cMatrix, [-movespeed,0,0]);
    }
    var S = key('S');
    if(S){
        mat4.translate(app.cMatrix, app.cMatrix, [0,0,movespeed]);
    }
    var D = key('D');
    if(D){
        mat4.translate(app.cMatrix, app.cMatrix, [movespeed,0,0]);
    }
    
    //Keyboard camera rotation
    var UP = key('<up>');
    if(UP){
        mat4.rotateX(app.cMatrix, app.cMatrix, .01*panspeed);
    }
    var DOWN = key('<down>');
    if(DOWN){
        mat4.rotateX(app.cMatrix, app.cMatrix, -.01*panspeed);
    }
    var LEFT = key('<left>');
    if(LEFT){
        mat4.rotateY(app.cMatrix, app.cMatrix, .01*panspeed);
    }
    var RIGHT = key('<right>');
    if(RIGHT){
        mat4.rotateY(app.cMatrix, app.cMatrix, -.01*panspeed);
    }

    //Mouse camera rotation
    var height = canvas.height;
    var width = canvas.width;
    if(mbut.left){
        mat4.rotateY(app.cMatrix, app.cMatrix, -panspeed*(mpos[0] - mpos.prev[0]) / width);
        mat4.rotateX(app.cMatrix, app.cMatrix, -panspeed*(mpos[1] - mpos.prev[1]) / height);
    }
    
    // set up the scene
    mvPushMatrix();

    //draw objects
    if(app.meshes && Object.keys(app.meshes).length > 0){
        Object.keys(app.meshes).forEach(function(key) {
            if(key)
            drawObject(app.meshes[key]);

            console.log(key);
        });
    }
        
    mvPopMatrix();
}

function tick(){
    requestAnimationFrame(tick);
    drawScene();
    animate();
}

function webGLStart(){

    mpos = attach(canvas);
    mbut = pressed(canvas);

    initShaders();
    gl.clearColor(0.2, 0.75, 0.75, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    tick()
    // drawScene();
}

// obj name used as key to add and delete obj from scene
// file location is a string 

function addModel(objName, fileLocation) {

    var wavefrontString = readFileSync(__dirname + '/models/caiman.obj', 'utf8');
    var mesh = load_obj(gl, wavefrontString);

    app.meshes[objName] = mesh;
    console.log(app.meshes);
}

function removeModel(objName) {
    if (app.meshes.hasOwnProperty(objName)) {           
        delete app.meshes[objName];
    }
}


window.onload = function (){

    canvas = document.getElementById('mycanvas');
    gl = initWebGL(canvas);

    addModel('caiman', '/models/caiman.obj');
    addModel('lion', '/models/die.obj');

    webGLStart();
}
