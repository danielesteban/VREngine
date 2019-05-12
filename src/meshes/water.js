import {
  BufferAttribute,
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  VertexColors,
} from 'three';

class Water extends Object3D {
  constructor({
    chunks = 4,
    scale = 3,
  } = {}) {
    const { size } = Water;
    if (!Water.geometry) {
      const geometry = new BufferGeometry();
      const position = new Float32Array((size ** 2) * 9 * 2);
      const color = new Float32Array((size ** 2) * 9 * 2);
      geometry.addAttribute('position', (new BufferAttribute(position, 3)).setDynamic(true));
      geometry.addAttribute('color', (new BufferAttribute(color, 3)).setDynamic(true));
      Water.geometry = geometry;
    }
    if (!Water.light) {
      const light = new Float32Array((size ** 2) * 2);
      for (let index = 0, z = 0; z < size; z += 1) {
        for (let x = 0; x < size; x += 1) {
          for (let i = 0; i < 2; i += 1, index += 1) {
            light[index] = 1 + (Math.random() * 2);
          }
        }
      }
      Water.light = light;
    }
    if (!Water.material) {
      const material = new MeshBasicMaterial({
        color: 0x223366,
        vertexColors: VertexColors,
      });
      Water.material = material;
    }
    super();
    for (let z = -chunks; z <= chunks; z += 1) {
      for (let x = -chunks; x <= chunks; x += 1) {
        const mesh = new Mesh(
          Water.geometry,
          Water.material
        );
        mesh.position.set(
          x * size,
          0,
          z * size
        );
        this.add(mesh);
      }
    }
    this.scale.set(scale, 1, scale);
  }

  static onAnimationTick({ time }) {
    const { geometry, light, size } = Water;
    const { attributes: { color, position } } = geometry;
    let stride = 0;
    const waveHeight = Math.sin(time * 0.5) * 0.15;
    for (let z = 0; z < size; z += 1) {
      for (let x = 0; x < size; x += 1) {
        const pos = {
          x: x - (size * 0.5),
          y: 0,
          z: z - (size * 0.5),
        };
        const elevationA = (
          (Math.sin(z * Math.PI * 0.5) * waveHeight)
          + (Math.sin(z * Math.PI * 0.125) * waveHeight)
        );
        const elevationB = (
          (Math.sin((z + 1) * Math.PI * 0.5) * waveHeight)
          + (Math.sin((z + 1) * Math.PI * 0.125) * waveHeight)
        );
        position.array.set([
          pos.x + 0.5, pos.y + elevationB, pos.z + 1,
          pos.x + 1, pos.y + elevationA, pos.z,
          pos.x, pos.y + elevationA, pos.z,
        ], stride);
        {
          const intensity = 0.95 + (Math.sin(time * light[stride / 9]) * 0.05);
          color.array.set([
            intensity, intensity, intensity,
            intensity, intensity, intensity,
            intensity, intensity, intensity,
          ], stride);
        }
        stride += 9;
        position.array.set([
          pos.x + 0.5, pos.y + elevationB, pos.z + 1,
          pos.x + 1.5, pos.y + elevationB, pos.z + 1,
          pos.x + 1, pos.y + elevationA, pos.z,
        ], stride);
        {
          const intensity = 0.95 + (Math.sin(time * light[stride / 9]) * 0.05);
          color.array.set([
            intensity, intensity, intensity,
            intensity, intensity, intensity,
            intensity, intensity, intensity,
          ], stride);
        }
        stride += 9;
      }
    }
    color.needsUpdate = true;
    position.needsUpdate = true;
    geometry.computeBoundingSphere();
  }
}

Water.size = 16;

export default Water;
