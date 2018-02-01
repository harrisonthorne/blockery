/* jshint esversion: 6, browser: true, devel: true */
/* global loadTextResource, initGame, Board, Data, mat4, glMatrix, main, CUBE_MESH */

window.glCanvas = document.getElementById('glCanvas');
window.canvas2d = document.getElementById('canvas2d');
window.gl = window.glCanvas.getContext('webgl');
window.ctx2d = window.canvas2d.getContext('2d');

if (!window.ctx2d) alert('This browser does not support canvas drawing');
if (!window.gl) window.gl = window.glCanvas.getContext('experimental-webgl');
if (!window.gl) alert('This browser does not support WebGL.');

const VISIBLE_HEIGHT = 1000;
const VISIBLE_WIDTH = VISIBLE_HEIGHT * 9 / 16;
const UPDATES_PER_SECOND = 60;

function init() {

   let gl = window.gl;
   let glCanvas = window.glCanvas;
   let ctx2d = window.ctx2d;
   let canvas2d = window.canvas2d;

   Data.load(ctx2d);

   let shaders;
   let buffers;
   let matrices;
   let programInfo;

   window.onresize = () => {
      window.glCanvas.width = window.innerWidth;
      window.glCanvas.height = window.innerHeight;

      window.canvas2d.width = window.innerWidth;
      window.canvas2d.height = window.innerHeight;

      gl.viewport(0, 0, glCanvas.width, glCanvas.height);
      getPerspectiveMatrix(matrices.proj);
      bindMatrix(matrices.proj, programInfo.uniformLocations.projMatrix);
   };

   getShaders(result => {
      shaders = result;
      programInfo = getShaderProgramInfo(gl, shaders);

      gl.useProgram(programInfo.program);

      buffers = getBuffers(gl);
      initCulling(gl);
      matrices = getMatrices(gl, programInfo);
      initLighting(gl, programInfo);
      CubeMesh.init(gl, matrices, programInfo);

      window.onresize();

      main(glCanvas, gl, canvas2d, ctx2d, programInfo, matrices, buffers);
   });

   /* Initialize everything else */
   Board.init(ctx2d, Data.boardCode);
   initGame();
   initSettings();

}

function error(error) {
   let errorBox = document.getElementById('error_text');
   errorBox.innerHTML = errorBox.innerHTML + error + '<br/><br/>';
}

function getBuffers(gl) {
   return {
      vertex: gl.createBuffer(),
      normal: gl.createBuffer(),
      index: gl.createBuffer()
   };
}

function getShaders(callback) {
   loadTextResource('shaders/vertex.glsl', function (vsError, vsResult) {
      if (vsError)
         error(vsError);
      else
         loadTextResource('shaders/fragment.glsl', function (fsError, fsResult) {
            if (fsError)
               error(fsError);
            else {
               callback({
                  vertexShader: vsResult,
                  fragmentShader: fsResult
               });
            }
         });
   });
}

/************************************************
 * GET SHADER PROGRAM
 * Compiles, links, and validates a shader program
 * to be used through the entire application.
 ************************************************/
function getShaderProgramInfo(gl, shaders) {
   let prog = gl.createProgram();
   let vertex = gl.createShader(gl.VERTEX_SHADER);
   let fragment = gl.createShader(gl.FRAGMENT_SHADER);

   gl.shaderSource(vertex, shaders.vertexShader);
   gl.shaderSource(fragment, shaders.fragmentShader);

   compileShaderOrError(gl, vertex);
   compileShaderOrError(gl, fragment);

   gl.attachShader(prog, vertex);
   gl.attachShader(prog, fragment);

   gl.linkProgram(prog);
   if (!gl.getProgramParameter(prog, gl.LINK_STATUS))
      error(gl.getProgramInfoLog(prog));

   gl.validateProgram(prog);
   if (!gl.getProgramParameter(prog, gl.VALIDATE_STATUS))
      error(gl.getProgramInfoLog(prog));

   let vertexPosAttrib = gl.getAttribLocation(prog, 'vertPos');
   let vertexNormalAttrib = gl.getAttribLocation(prog, 'vertNormal');

   let wmLocation = gl.getUniformLocation(prog, 'mWorld');
   let vmLocation = gl.getUniformLocation(prog, 'mView');
   let pmLocation = gl.getUniformLocation(prog, 'mProj');
   let colorLocation = gl.getUniformLocation(prog, 'color');

   return {
      program: prog,
      uniformLocations: {
         worldMatrix: wmLocation,
         viewMatrix: vmLocation,
         projMatrix: pmLocation,
         color: colorLocation
      },
      attributeLocations: {
         position: vertexPosAttrib,
         normal: vertexNormalAttrib
      }
   };
}

function compileShaderOrError(gl, shader) {
   gl.compileShader(shader);
   if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
      error(gl.getShaderInfoLog(shader));
   }
}

function initCulling(gl) {
   gl.enable(gl.DEPTH_TEST);
   gl.enable(gl.CULL_FACE);
   gl.cullFace(gl.BACK);
   gl.frontFace(gl.CCW);
}

function setCameraOffset(x, y, cameraMatrix, matrixUniformLocation) {
   mat4.lookAt(cameraMatrix, [VISIBLE_WIDTH / 2 - x, VISIBLE_HEIGHT / 2 - y, -CAMERA_Z], [VISIBLE_WIDTH / 2 - x, VISIBLE_HEIGHT / 2 - y, 0], [0, -1, 0]); // out, eye, center, upAxis
   bindMatrix(cameraMatrix, matrixUniformLocation);
}


function getMatrices(gl, programInfo) {
   let i = new Float32Array(16);
   let w = new Float32Array(16);
   let v = new Float32Array(16);
   let p = new Float32Array(16);

   mat4.identity(i);
   mat4.lookAt(w, [VISIBLE_WIDTH / 2, VISIBLE_HEIGHT / 2, -CAMERA_Z], [VISIBLE_WIDTH / 2, VISIBLE_HEIGHT / 2, 0], [0, -1, 0]); // out, eye, center, upAxis
   mat4.identity(v);
   getPerspectiveMatrix(p);

   bindMatrix(w, programInfo.uniformLocations.worldMatrix);
   bindMatrix(v, programInfo.uniformLocations.viewMatrix);
   bindMatrix(p, programInfo.uniformLocations.projMatrix);

   return {
      world: w,
      view: v,
      proj: p,
      identity: i
   };
}

function bindMatrix(matrix, uniformLocation) {
   window.gl.uniformMatrix4fv(uniformLocation, false, matrix);
}

const fieldOfView = 45;
const CAMERA_Z = VISIBLE_HEIGHT / 2 / Math.tan(fieldOfView * Math.PI / 180 / 2);

function getPerspectiveMatrix(output) {
   mat4.perspective(
      output,
      fieldOfView * Math.PI / 180,
      window.glCanvas.width / window.glCanvas.height,
      0.1,
      CAMERA_Z * -1 + 100
   );
}

function initLighting(gl, programInfo) {
   let ambientLightIntensityLocation = gl.getUniformLocation(programInfo.program, 'ambientLightIntensity');
   let sunIntensityLocation = gl.getUniformLocation(programInfo.program, 'sun.color');
   let sunPositionLocation = gl.getUniformLocation(programInfo.program, 'sun.position');

   gl.uniform3f(ambientLightIntensityLocation, 0.85, 0.85, 0.85);
   gl.uniform3f(sunIntensityLocation, 0.15, 0.15, 0.15);
   gl.uniform3f(sunPositionLocation, 0, 0, -1);
}
