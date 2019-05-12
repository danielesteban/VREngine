import {
  Object3D,
  PerspectiveCamera,
  Vector3,
} from 'three';

class Camera extends PerspectiveCamera {
  constructor() {
    super(75, 1, 0.1, 1000);
    this.rotation.order = 'YXZ';
    this.direction = new Vector3();
    this.worldPosition = new Vector3();
    this.room = new Object3D();
    this.room.add(this);
    this.debug = {
      active: false,
      aux: {
        forward: new Vector3(),
        right: new Vector3(),
        up: new Vector3(),
        worldUp: new Vector3(0, 1, 0),
      },
    };
    this.reset();
  }

  onAnimationTick({ delta }) {
    const {
      destination,
      direction,
      room,
      speed,
    } = this;
    if (!destination) return;
    const step = speed * delta;
    const distance = destination.distanceTo(room.position);
    if (distance <= step) {
      room.position.copy(destination);
      delete this.destination;
      return;
    }
    room.position.addScaledVector(direction, step);
  }

  processInput({
    animation: { delta },
    input: {
      keyboard,
      mouse,
    },
  }) {
    const { debug, rotation } = this;
    if (mouse.x !== 0 || mouse.y !== 0) {
      const sensitivity = 0.003;
      rotation.y -= mouse.x * sensitivity;
      rotation.x -= mouse.y * sensitivity;
      const PI_2 = Math.PI / 2;
      rotation.x = Math.max(-PI_2, Math.min(PI_2, rotation.x));
      mouse.set(0, 0);
      this.updateMatrixWorld();
    }

    if (debug.active) {
      const { position } = this;
      if (keyboard.x !== 0 || keyboard.y !== 0 || keyboard.z !== 0) {
        const { direction } = this;
        const {
          forward,
          right,
          up,
          worldUp,
        } = debug.aux;
        this.getWorldDirection(forward);
        right.crossVectors(forward, worldUp).normalize();
        up.crossVectors(right, forward).normalize();
        direction
          .set(0, 0, 0)
          .addScaledVector(right, keyboard.x)
          .addScaledVector(up, keyboard.y)
          .addScaledVector(forward, keyboard.z)
          .normalize();
        position.addScaledVector(direction, 10 * delta);
        this.updateMatrixWorld();
      }
    }
  }

  reset() {
    const { debug, position, room } = this;
    debug.active = false;
    position.set(0, 1.6, 0);
    room.position.set(0, 0, 0);
    this.lookAt(0, 1.6, -1);
  }

  setDestination(point) {
    const { direction, room } = this;
    this.destination = point;
    this.speed = Math.max(point.distanceTo(room.position) / 0.2, 2);
    direction
      .copy(point)
      .sub(room.position)
      .normalize();
  }
}

export default Camera;
