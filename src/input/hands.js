import {
  BufferGeometry,
  Line,
  LineBasicMaterial,
  Matrix4,
  Mesh,
  MeshBasicMaterial,
  Object3D,
  SphereGeometry,
  Vector3,
} from 'three';

class HandsInput extends Object3D {
  constructor({ standingMatrix }) {
    if (
      !HandsInput.mesh
      || !HandsInput.pointerMesh
    ) HandsInput.setup();

    super();
    const { mesh, pointerMesh } = HandsInput;
    this.standingMatrix = standingMatrix;
    for (let i = 0; i < 2; i += 1) {
      const hand = mesh.clone();
      hand.buttons = {
        primary: false,
        primaryDown: false,
        primaryUp: false,
        secondary: false,
        secondaryDown: false,
        secondaryUp: false,
        tertiary: false,
        tertiaryDown: false,
        tertiaryUp: false,
      };
      hand.pointer = pointerMesh.clone();
      hand.pointer.visible = false;
      hand.add(hand.pointer);
      hand.matrixAutoUpdate = false;
      hand.setupRaycaster = ({ raycaster }) => HandsInput.setupRaycaster({ hand, raycaster });
      hand.visible = false;
      this.add(hand);
    }
  }

  update() {
    const { children } = this;
    const gamepads = ('getGamepads' in navigator ? navigator.getGamepads() : []);
    children.forEach((hand) => {
      hand.visible = false;
    });
    let hand = 0;
    for (let i = 0; i < gamepads.length; i += 1) {
      const gamepad = gamepads[i];
      if (
        gamepad
        && (
          gamepad.id === 'OpenVR Gamepad'
          || gamepad.id.startsWith('Oculus Touch')
          || gamepad.id.startsWith('Spatial Controller')
        )
      ) {
        if (gamepad.pose) {
          this.updateHand({
            hand: children[hand],
            buttons: gamepad.buttons,
            pose: gamepad.pose,
          });
        }
        hand += 1;
        if (hand > 1) break;
      }
    }
  }

  updateHand({
    hand,
    buttons,
    pose,
  }) {
    const { standingMatrix } = this;
    if (pose.position !== null) {
      hand.position.fromArray(pose.position);
    }
    if (pose.orientation !== null) {
      hand.quaternion.fromArray(pose.orientation);
    }
    hand.matrix.compose(hand.position, hand.quaternion, hand.scale);
    hand.matrix.premultiply(standingMatrix);
    hand.matrixWorldNeedsUpdate = true;
    hand.visible = true;

    const primary = buttons[0] && buttons[0].pressed;
    hand.buttons.primaryDown = primary && hand.buttons.primary !== primary;
    hand.buttons.primaryUp = !primary && hand.buttons.primary !== primary;
    hand.buttons.primary = primary;
    const secondary = buttons[1] && buttons[1].pressed;
    hand.buttons.secondaryDown = secondary && hand.buttons.secondary !== secondary;
    hand.buttons.secondaryUp = !secondary && hand.buttons.secondary !== secondary;
    hand.buttons.secondary = secondary;
    const tertiary = buttons[2] && buttons[2].pressed;
    hand.buttons.tertiaryDown = tertiary && hand.buttons.tertiary !== tertiary;
    hand.buttons.tertiaryUp = !tertiary && hand.buttons.tertiary !== tertiary;
    hand.buttons.tertiary = tertiary;
  }

  static setupRaycaster({ hand, raycaster }) {
    if (!hand.auxMatrix) {
      hand.auxMatrix = new Matrix4();
    }
    const { auxMatrix, matrixWorld } = hand;
    auxMatrix.identity().extractRotation(matrixWorld);
    raycaster.ray.origin.setFromMatrixPosition(matrixWorld);
    raycaster.ray.direction.set(0, 0, -1).applyMatrix4(auxMatrix);
  }

  static setup() {
    if (!HandsInput.geometry) {
      const geometry = new SphereGeometry(0.05, 8, 8);
      geometry.faces.forEach((face, i) => {
        if (i % 2 === 1) {
          face.color.offsetHSL(0, 0, Math.random() * -0.1);
          geometry.faces[i - 1].color.copy(face.color);
        }
      });
      HandsInput.geometry = (new BufferGeometry()).fromGeometry(geometry);
    }
    if (!HandsInput.material) {
      HandsInput.material = new MeshBasicMaterial({
        color: 0xffe0bd,
      });
    }
    if (!HandsInput.mesh) {
      HandsInput.mesh = new Mesh(
        HandsInput.geometry,
        HandsInput.material
      );
    }
    if (!HandsInput.pointerGeometry) {
      HandsInput.pointerGeometry = (new BufferGeometry())
        .setFromPoints([new Vector3(0, 0, 0), new Vector3(0, 0, -1)]);
    }
    if (!HandsInput.pointerMaterial) {
      HandsInput.pointerMaterial = new LineBasicMaterial({
        color: 0xffe0bd,
      });
    }
    if (!HandsInput.pointerMesh) {
      HandsInput.pointerMesh = new Line(
        HandsInput.pointerGeometry,
        HandsInput.pointerMaterial
      );
    }
  }
}

export default HandsInput;
