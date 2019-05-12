import {
  BufferGeometry,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  VertexColors,
} from 'three';

class Ground extends Mesh {
  constructor({
    color = 0,
    width = 128,
    height = 128,
  }) {
    const geometry = new PlaneGeometry(width, height, Math.ceil(width), Math.ceil(height));
    geometry.rotateX(Math.PI * -0.5);
    geometry.faces.forEach((face, i) => {
      if (i % 2 === 1) {
        face.color.offsetHSL(0, 0, Math.random() * -0.05);
        geometry.faces[i - 1].color.copy(face.color);
      }
    });
    super(
      (new BufferGeometry()).fromGeometry(geometry),
      new MeshBasicMaterial({
        color,
        vertexColors: VertexColors,
      })
    );
    this.isTranslocable = true;
  }

  dispose() {
    const { geometry, material } = this;
    geometry.dispose();
    material.dispose();
  }
}

export default Ground;
