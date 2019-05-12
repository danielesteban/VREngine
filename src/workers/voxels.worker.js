// eslint-disable-next-line no-restricted-globals
const context = self;

const mesh = ({ id, map, size }) => {
  const cache = new Map();
  const get = (x, y, z) => {
    if (
      x < 0 || x >= size
      || y < 0 || y >= size
      || z < 0 || z >= size
    ) {
      return { type: 0 };
    }
    const key = `${x}:${y}:${z}`;
    let voxel = cache.get(key);
    if (!voxel) {
      const packed = map[z * size * size + y * size + x];
      const type = (packed >> 24) & 0xFF;
      const r = ((packed >> 16) & 0xFF) / 0xFF;
      const g = ((packed >> 8) & 0xFF) / 0xFF;
      const b = (packed & 0xFF) / 0xFF;
      voxel = {
        type,
        r,
        g,
        b,
      };
      cache.set(key, voxel);
    }
    return voxel;
  };
  const test = (x, y, z) => (
    !!get(x, y, z).type
  );
  const ao = (neighbors) => {
    if (neighbors[0] && neighbors[1]) {
      neighbors[3] = true;
    }
    return neighbors.reduce((light, n) => (
      n ? light - 0.2 : light
    ), 1);
  };
  const index = [];
  const position = [];
  const color = [];
  const normal = [];
  const uv = [];
  let offset = 0;
  const pushFace = (
    p1, n1,
    p2, n2,
    p3, n3,
    p4, n4,
    c,
    n,
    t
  ) => {
    const vertices = [p1, p2, p3, p4];
    const light = [ao(n1), ao(n2), ao(n3), ao(n4)];
    const uvs = [[t, 0], [t + 1, 0], [t + 1, 1], [t, 1]];
    if (light[0] + light[2] < light[1] + light[3]) {
      vertices.unshift(vertices.pop());
      light.unshift(light.pop());
      uvs.unshift(uvs.pop());
    }
    vertices.forEach(vertex => position.push(...vertex));
    light.forEach(light => color.push(
      c[0] * light,
      c[1] * light,
      c[2] * light
    ));
    normal.push(...n, ...n, ...n, ...n);
    uvs.forEach(coords => uv.push(...coords));
    index.push(
      offset, offset + 1, offset + 2,
      offset + 2, offset + 3, offset
    );
    offset += 4;
  };
  for (let z = 0; z < size; z += 1) {
    for (let y = 0; y < size; y += 1) {
      for (let x = 0; x < size; x += 1) {
        const {
          type,
          r,
          g,
          b,
        } = get(x, y, z);
        if (type > 0) {
          // TOP
          if (!test(x, y + 1, z)) {
            pushFace(
              [x, y + 1, z + 1],
              [test(x - 1, y + 1, z), test(x, y + 1, z + 1), test(x - 1, y + 1, z + 1)],
              [x + 1, y + 1, z + 1],
              [test(x + 1, y + 1, z), test(x, y + 1, z + 1), test(x + 1, y + 1, z + 1)],
              [x + 1, y + 1, z],
              [test(x + 1, y + 1, z), test(x, y + 1, z - 1), test(x + 1, y + 1, z - 1)],
              [x, y + 1, z],
              [test(x - 1, y + 1, z), test(x, y + 1, z - 1), test(x - 1, y + 1, z - 1)],
              [r, g, b],
              [0, 1, 0],
              type - 1
            );
          }
          // BOTTOM
          if (!test(x, y - 1, z)) {
            pushFace(
              [x, y, z],
              [test(x - 1, y - 1, z), test(x, y - 1, z - 1), test(x - 1, y - 1, z - 1)],
              [x + 1, y, z],
              [test(x + 1, y - 1, z), test(x, y - 1, z - 1), test(x + 1, y - 1, z - 1)],
              [x + 1, y, z + 1],
              [test(x + 1, y - 1, z), test(x, y - 1, z + 1), test(x + 1, y - 1, z + 1)],
              [x, y, z + 1],
              [test(x - 1, y - 1, z), test(x, y - 1, z + 1), test(x - 1, y - 1, z + 1)],
              [r, g, b],
              [0, -1, 0],
              type - 1
            );
          }
          // SOUTH
          if (!test(x, y, z + 1)) {
            pushFace(
              [x, y, z + 1],
              [test(x - 1, y, z + 1), test(x, y - 1, z + 1), test(x - 1, y - 1, z + 1)],
              [x + 1, y, z + 1],
              [test(x + 1, y, z + 1), test(x, y - 1, z + 1), test(x + 1, y - 1, z + 1)],
              [x + 1, y + 1, z + 1],
              [test(x + 1, y, z + 1), test(x, y + 1, z + 1), test(x + 1, y + 1, z + 1)],
              [x, y + 1, z + 1],
              [test(x - 1, y, z + 1), test(x, y + 1, z + 1), test(x - 1, y + 1, z + 1)],
              [r, g, b],
              [0, 0, 1],
              type - 1
            );
          }
          // NORTH
          if (!test(x, y, z - 1)) {
            pushFace(
              [x + 1, y, z],
              [test(x + 1, y, z - 1), test(x, y - 1, z - 1), test(x + 1, y - 1, z - 1)],
              [x, y, z],
              [test(x - 1, y, z - 1), test(x, y - 1, z - 1), test(x - 1, y - 1, z - 1)],
              [x, y + 1, z],
              [test(x - 1, y, z - 1), test(x, y + 1, z - 1), test(x - 1, y + 1, z - 1)],
              [x + 1, y + 1, z],
              [test(x + 1, y, z - 1), test(x, y + 1, z - 1), test(x + 1, y + 1, z - 1)],
              [r, g, b],
              [0, 0, -1],
              type - 1
            );
          }
          // WEST
          if (!test(x + 1, y, z)) {
            pushFace(
              [x + 1, y, z + 1],
              [test(x + 1, y, z + 1), test(x + 1, y - 1, z), test(x + 1, y - 1, z + 1)],
              [x + 1, y, z],
              [test(x + 1, y, z - 1), test(x + 1, y - 1, z), test(x + 1, y - 1, z - 1)],
              [x + 1, y + 1, z],
              [test(x + 1, y, z - 1), test(x + 1, y + 1, z), test(x + 1, y + 1, z - 1)],
              [x + 1, y + 1, z + 1],
              [test(x + 1, y, z + 1), test(x + 1, y + 1, z), test(x + 1, y + 1, z + 1)],
              [r, g, b],
              [1, 0, 0],
              type - 1
            );
          }
          // EAST
          if (!test(x - 1, y, z)) {
            pushFace(
              [x, y, z],
              [test(x - 1, y, z - 1), test(x - 1, y - 1, z), test(x - 1, y - 1, z - 1)],
              [x, y, z + 1],
              [test(x - 1, y, z + 1), test(x - 1, y - 1, z), test(x - 1, y - 1, z + 1)],
              [x, y + 1, z + 1],
              [test(x - 1, y, z + 1), test(x - 1, y + 1, z), test(x - 1, y + 1, z + 1)],
              [x, y + 1, z],
              [test(x - 1, y, z - 1), test(x - 1, y + 1, z), test(x - 1, y + 1, z - 1)],
              [r, g, b],
              [-1, 0, 0],
              type - 1
            );
          }
        }
      }
    }
  }
  const geometry = {
    index: new Uint32Array(index),
    position: new Float32Array(position),
    color: new Float32Array(color),
    normal: new Float32Array(normal),
    uv: new Float32Array(uv),
  };
  context.postMessage({
    id,
    ...geometry,
  }, [
    geometry.index.buffer,
    geometry.position.buffer,
    geometry.color.buffer,
    geometry.normal.buffer,
    geometry.uv.buffer,
  ]);
};

context.addEventListener('message', ({ data: { id, map, size } }) => (
  setImmediate(() => mesh({ id, map, size }))
));
