// var fs = require('fs');

// var meshPath = './development/models/sphere.obj';
// var opt = { encoding: 'utf8' };

// fs.readFile(meshPath, opt, function (err, data){
//   if (err) return console.error(err);
//   var mesh = new OBJ.Mesh(data);
// });

import * as OBJ from 'webgl-obj-loader';
import { mat4, mat3 } from 'gl-matrix';
import * as normals from 'normals';
import * as teapot from 'teapot';
import pack from 'array-pack-2d';
// import { OBJ } from 'webgl-obj-loader';

// WebGL context
var gl = {};
// the canvas element
var canvas = null;
// main shader program
var shaderProgram = null;
// main app object
var app = {};
app.meshes = {};
app.models = {};
app.mvMatrix = mat4.create();
app.mvMatrixStack = [];
app.pMatrix = mat4.create();

window.requestAnimFrame = (function (){
    return window.requestAnimationFrame ||
        window.webkitRequestAnimationFrame ||
        window.mozRequestAnimationFrame ||
        window.oRequestAnimationFrame ||
        window.msRequestAnimationFrame ||
        function (/* function FrameRequestCallback */ callback, /* DOMElement Element */ element){
            return window.setTimeout(callback, 1000 / 60);
        };
})();

function initWebGL(canvas){
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
    if (shaderScript.type == "x-shader/x-fragment"){
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if (shaderScript.type == "x-shader/x-vertex"){
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

function drawObject(obj){
    /*
     Takes in a model that points to a mesh and draws the object on the scene.
     Assumes that the setMatrixUniforms function exists
     as well as the shaderProgram has a uniform attribute called "samplerUniform"
     */
//    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.mesh.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, obj.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, obj.mesh.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, obj.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (obj.mesh.textures.length){
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, obj.mesh.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, obj.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    else{
        gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, obj.mesh.indexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, obj.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
}

function mvPushMatrix(){
    var copy = mat4.create();
    mat4.set(app.mvMatrix, copy);
    app.mvMatrixStack.push(copy);
}

function mvPopMatrix(){
    if (app.mvMatrixStack.length == 0){
        throw "Invalid popMatrix!";
    }
    app.mvMatrix = app.mvMatrixStack.pop();
}

function setMatrixUniforms(){
    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, app.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, app.mvMatrix);

    var normalMatrix = mat3.create();
    // mat3.fromMat4(app.mvMatrix, normalMatrix);
    // mat3.invert(normalMatrix, normalMatrix);
    // mat3.transpose(normalMatrix);
    gl.uniformMatrix3fv(shaderProgram.nMatrixUniform, false, normalMatrix);
}

function initBuffers(){
    // initialize the mesh's buffers
    for (var mesh in app.meshes){
        OBJ.initMeshBuffers(gl, app.meshes[mesh]);
        // this loops through the mesh names and creates new
        // model objects and setting their mesh to the current mesh
        app.models[mesh] = {};
        app.models[mesh].mesh = app.meshes[mesh];
    }
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
    
    mat4.identity(app.mvMatrix);
    mat4.perspective(app.pMatrix, gl.viewportWidth / gl.viewportHeight, 0.01, 1000.0, app.pMatrix);
    // mat4.translate(app.mvMatrix, [0, 0, -15]);
    // move the camera
    mat4.translate(app.mvMatrix, app.mvMatrix, [0, 0, -5]);
    // set up the scene
    mvPushMatrix();
    drawObject(app.models.obj_name);
    mvPopMatrix();
}

function tick(){
    requestAnimFrame(tick);
    drawScene();
    animate();
}

function webGLStart(meshes){
    app.meshes = meshes;
    canvas = document.getElementById('mycanvas');
    gl = initWebGL(canvas);
    initShaders();
    initBuffers();
    gl.clearColor(0.2, 0.75, 0.75, 1.0);
    gl.enable(gl.DEPTH_TEST);
    
    
    tick()
    // drawScene();
}

window.onload = function (){
    OBJ.downloadMeshes({
        'obj_name': 'models/caiman.obj',
        'obj_name2': 'models/lion-cub.obj'
    }, webGLStart);
}