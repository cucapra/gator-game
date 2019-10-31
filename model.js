
function main() {

var canvas = document.getElementById("gl_canvas");
var gl = canvas.getContext('webgl');

if (gl === null) {
    alert("Unable to initialize WebGL. Your browser or machine may not support it.");
    return;
  }

  // Set clear color to black, fully opaque
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  // Clear the color buffer with specified clear color
  gl.clear(gl.COLOR_BUFFER_BIT);


var objStr = document.getElementById('my_cube.obj').innerHTML;
var mesh = new OBJ.Mesh(objStr);

// use the included helper function to initialize the VBOs
// if you don't want to use this function, have a look at its
// source to see how to use the Mesh instance.
OBJ.initMeshBuffers(gl, mesh);
// have a look at the initMeshBuffers docs for an exmample of how to
// render the model at this point
}
window.onload = main;