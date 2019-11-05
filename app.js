// var fs = require('fs');

// import OBJ from 'webgl-obj-loader';
// var meshPath = './development/models/sphere.obj';
// var opt = { encoding: 'utf8' };

// fs.readFile(meshPath, opt, function (err, data){
//   if (err) return console.error(err);
//   var mesh = new OBJ.Mesh(data);
// });

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
app.cMatrix = mat4.create();
app.rotation = [0,0,0];
app.cameraAngle = 0;

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
    try{
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

function drawObject(model){
    /*
     Takes in a model that points to a mesh and draws the object on the scene.
     Assumes that the setMatrixUniforms function exists
     as well as the shaderProgram has a uniform attribute called "samplerUniform"
     */
//    gl.useProgram(shaderProgram);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.vertexBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, model.mesh.vertexBuffer.itemSize, gl.FLOAT, false, 0, 0);

    gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.normalBuffer);
    gl.vertexAttribPointer(shaderProgram.vertexNormalAttribute, model.mesh.normalBuffer.itemSize, gl.FLOAT, false, 0, 0);

    if (model.mesh.textures.length){
        gl.enableVertexAttribArray(shaderProgram.textureCoordAttribute);
        gl.bindBuffer(gl.ARRAY_BUFFER, model.mesh.textureBuffer);
        gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, model.mesh.textureBuffer.itemSize, gl.FLOAT, false, 0, 0);
    }
    else{
        gl.disableVertexAttribArray(shaderProgram.textureCoordAttribute);
    }

    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, model.mesh.indexBuffer);
    setMatrixUniforms();
    gl.drawElements(gl.TRIANGLES, model.mesh.indexBuffer.numItems, gl.UNSIGNED_SHORT, 0);
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
    mat4.inverse(app.cMatrix, app.mvMatrix);      //Obtain Model-View matrix from Camera Matrix
    // displayMatrix(cMatrix);

    gl.uniformMatrix4fv(shaderProgram.pMatrixUniform, false, app.pMatrix);
    gl.uniformMatrix4fv(shaderProgram.mvMatrixUniform, false, app.mvMatrix);

    var normalMatrix = mat3.create();
    mat4.toInverseMat3(app.mvMatrix, normalMatrix);
    mat3.transpose(normalMatrix);
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
        // do animations
    }
    app.lastTime = app.timeNow;
}

function yRotation (angleInRadians) {
    var c = Math.cos(angleInRadians);
    var s = Math.sin(angleInRadians);

    return [
      c, 0, -s, 0,
      0, 1, 0, 0,
      s, 0, c, 0,
      0, 0, 0, 1,
    ];
  }

function drawScene(){
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
    mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.01, 1000.0, app.pMatrix);
    mat4.identity(app.mvMatrix);
    // move the camera
    
    mat4.translate(app.mvMatrix, [0, 0, -15]);
    
    app.cMatrix = yRotation(app.cameraAngle+=.1);
    mat4.translate(app.cMatrix,[0, 0, 20]);

    //For rotating the camera itself (change app.rotation to use)
    mat4.rotateX(app.cMatrix,app.rotation[0]*Math.PI/180);
    mat4.rotateY(app.cMatrix,app.rotation[1]*Math.PI/180);
    mat4.rotateZ(app.cMatrix,app.rotation[2]*Math.PI/180);
    // mat4.translate(app.mvMatrix, [0, 0, -5]);
    // set up the scene
    mvPushMatrix();
        drawObject(app.models.obj_name);
        drawObject(app.models.obj_name2);
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
//    drawScene();
}

window.onload = function (){
    OBJ.downloadMeshes({
        'obj_name': 'http://localhost:1337/models/caiman.obj',
        'obj_name2': 'http://localhost:1337/models/lion-cub.obj'
    }, webGLStart);
}