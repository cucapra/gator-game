import { mat4 } from 'gl-matrix';
import * as normals from 'normals';
import pack from 'array-pack-2d';
import * as obj_loader from 'webgl-obj-loader';

export type Vec3Array = [number, number, number][];


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
export function load_obj(gl: WebGLRenderingContext, obj_src: string): Mesh {

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