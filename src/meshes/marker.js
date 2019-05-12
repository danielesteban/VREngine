import {
  Mesh,
  MeshBasicMaterial,
  SphereBufferGeometry,
} from 'three';

class Marker extends Mesh {
  constructor() {
    if (!Marker.geometry) {
      Marker.geometry = new SphereBufferGeometry(0.2, 32, 32);
    }
    if (!Marker.material) {
      Marker.material = new MeshBasicMaterial({
        color: 0xaaaaaa,
        opacity: 0.5,
        transparent: true,
      });
    }
    super(
      Marker.geometry,
      Marker.material
    );
  }

  onBeforeRender({ animation: { time } }) {
    const { scale } = this;
    const s = 1 + (Math.sin(time * 4) * 0.1);
    scale.set(s, s, s);
  }
}

export default Marker;
