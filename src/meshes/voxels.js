import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  BufferAttribute,
  VertexColors,
} from 'three';
import VoxelsMesher from '../workers/voxels';

class Voxels extends Mesh {
  constructor({
    color = 0xFFFFFF,
    generator,
    map,
    size,
    texture,
  }) {
    if (!Voxels.mesher) {
      Voxels.mesher = new VoxelsMesher();
    }
    super(
      new BufferGeometry(),
      new MeshBasicMaterial({
        color,
        map: texture || null,
        vertexColors: VertexColors,
      })
    );
    this.visible = false;
    if (generator) {
      map = new Uint32Array(size * size * size);
      let i = 0;
      for (let z = 0; z < size; z += 1) {
        for (let y = 0; y < size; y += 1) {
          for (let x = 0; x < size; x += 1, i += 1) {
            map[i] = generator({ x, y, z }) || 0;
          }
        }
      }
    }
    Voxels.mesher
      .generate({ size, map })
      .then(this.onMesherResults.bind(this));
  }

  onMesherResults({
    index,
    position,
    color,
    normal,
    uv,
  }) {
    if (this.disposed) {
      return;
    }
    const { geometry } = this;
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.addAttribute('position', new BufferAttribute(position, 3));
    geometry.addAttribute('color', new BufferAttribute(color, 3));
    geometry.addAttribute('normal', new BufferAttribute(normal, 3));
    geometry.addAttribute('uv', new BufferAttribute(uv, 2));
    geometry.computeBoundingSphere();
    this.visible = true;
  }

  dispose() {
    const { geometry, material } = this;
    geometry.dispose();
    material.dispose();
    this.disposed = true;
  }
}

export default Voxels;
