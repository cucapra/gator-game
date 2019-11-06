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
var gl;
// the canvas element
var canvas = null;
// main shader program
var shaderProgram = null;
// main app object
var app: {meshes: {}, models: {}, mvMatrix: mat4, mvMatrixStack: number[], pMatrix: mat4};

// app.meshes = {};
// app.models = {};
// app.mvMatrix = mat4.create();
// app.mvMatrixStack = [];
// app.pMatrix = mat4.create();

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
    // gl.viewportWidth = canvas.width;
    // gl.viewportHeight = canvas.height;
    // gl.viewport(0, 0, canvas.width, canvas.height);
    return gl;
}

export function drawObject(obj: model){
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