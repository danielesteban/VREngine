import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  BufferAttribute,
  Raycaster,
  VertexColors,
} from 'three';

class Heightmap extends Mesh {
  constructor({
    color,
    map,
  }) {
    const width = map[0].length - 1;
    const height = map.length - 1;
    const maxDepth = map.reduce(
      (max, row) => row.reduce(
        (max, depth) => Math.max(max, depth),
        max
      ),
      0
    );
    const position = new Float32Array(width * height * 4 * 3);
    const albedo = new Float32Array(width * height * 4 * 3);
    const index = new Uint32Array(width * height * 6);
    let vo = 0;
    let qo = 0;
    let io = 0;
    const quadV = [
      [0, 1],
      [1, 1],
      [1, 0],
      [0, 0],
    ];
    const quadI = [
      0, 1, 2,
      2, 3, 0,
    ];
    const pushQuad = (x, y) => {
      const light = 1 - Math.random() * 0.1;
      quadV.forEach(([vx, vy], i) => {
        const o = vo + i * 3;
        const depth = map[y + vy][x + vx];
        position[o] = width * -0.5 + (x + vx);
        position[o + 1] = height * 0.5 - (y + vy);
        position[o + 2] = depth;
        const ao = 0.8 + (depth / maxDepth * 0.2);
        albedo[o] = light * ao;
        albedo[o + 1] = light * ao;
        albedo[o + 2] = light * ao;
      });
      vo += quadV.length * 3;
      quadI.forEach((v, i) => {
        index[io + i] = qo + v;
      });
      io += quadI.length;
      qo += quadV.length;
    };
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        pushQuad(x, y);
      }
    }
    const geometry = new BufferGeometry();
    geometry.setIndex(new BufferAttribute(index, 1));
    geometry.addAttribute('position', new BufferAttribute(position, 3));
    geometry.addAttribute('color', new BufferAttribute(albedo, 3));
    geometry.rotateX(Math.PI * -0.5);
    super(
      geometry,
      new MeshBasicMaterial({
        color,
        vertexColors: VertexColors,
      })
    );
    this.maxDepth = maxDepth;
    this.isTranslocable = true;
  }

  getFloorY({ x, z }) {
    if (!Heightmap.raycaster) {
      Heightmap.raycaster = new Raycaster();
    }
    const { raycaster } = Heightmap;
    this.updateMatrixWorld();
    raycaster.ray.origin.set(x, 100, z);
    raycaster.ray.direction.set(0, -1, 0);
    const hit = raycaster.intersectObject(this)[0] || false;
    return hit ? hit.point.y : 0;
  }

  dispose() {
    const { geometry, material } = this;
    geometry.dispose();
    material.dispose();
  }
}

export default Heightmap;
