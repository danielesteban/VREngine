import {
  Scene as ThreeScene,
} from 'three';

class Scene extends ThreeScene {
  constructor({
    fog,
    marker,
    onBeforeRender,
    room,
    sky,
  }) {
    super();
    this.animations = [];
    this.intersects = [];
    this.fog = fog;
    this.onBeforeRender = onBeforeRender;
    this.add(sky);
    this.add(marker);
    this.add(room);
  }

  dispose() {
    const { children } = this;
    children.forEach((child) => {
      if (child.dispose) {
        child.dispose();
      }
    });
  }
}

export default Scene;
