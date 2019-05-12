import fullscreen from 'fullscreen';
import pointerlock from 'pointer-lock';
import {
  Vector2,
  Vector3,
} from 'three';

class DesktopInput {
  constructor({ mount }) {
    this.buttons = {};
    this.keyboard = new Vector3(0, 0, 0);
    this.mouse = new Vector2(0, 0);
    this.origin = new Vector2(0, 0);
    this.fullscreen = fullscreen(mount);
    this.onBlur = this.onBlur.bind(this);
    this.onMouseDown = this.onMouseDown.bind(this);
    this.onMouseUp = this.onMouseUp.bind(this);
    this.onKeyboardDown = this.onKeyboardDown.bind(this);
    this.onKeyboardUp = this.onKeyboardUp.bind(this);
    if (pointerlock.available()) {
      this.pointerlock = pointerlock(mount);
      this.pointerlock.on('attain', this.onPointerLockAttain.bind(this));
    }
  }

  onBlur() {
    const { keyboard } = this;
    this.buttons = {};
    keyboard.set(0, 0, 0);
  }

  onMouseDown({ button }) {
    const { buttons } = this;
    switch (button) {
      case 2:
        buttons.secondary = true;
        buttons.secondaryDown = true;
        break;
      default:
        buttons.primary = true;
        buttons.primaryDown = true;
    }
  }

  onMouseUp({ button }) {
    const { buttons } = this;
    switch (button) {
      case 2:
        if (buttons.secondary) {
          buttons.secondary = false;
          buttons.secondaryUp = true;
        }
        break;
      default:
        if (buttons.primary) {
          buttons.primary = false;
          buttons.primaryUp = true;
        }
    }
  }

  onKeyboardDown({ keyCode, repeat }) {
    const { keyboard } = this;
    if (repeat) return;
    switch (keyCode) {
      case 65:
        keyboard.x = -1;
        break;
      case 68:
        keyboard.x = 1;
        break;
      case 16:
        keyboard.y = -1;
        break;
      case 32:
        keyboard.y = 1;
        break;
      case 83:
        keyboard.z = -1;
        break;
      case 87:
        keyboard.z = 1;
        break;
      default:
        break;
    }
  }

  onKeyboardUp({ keyCode, repeat }) {
    const { keyboard } = this;
    if (repeat) return;
    switch (keyCode) {
      case 65:
        if (keyboard.x < 0) keyboard.x = 0;
        break;
      case 68:
        if (keyboard.x > 0) keyboard.x = 0;
        break;
      case 16:
        if (keyboard.y < 0) keyboard.y = 0;
        break;
      case 32:
        if (keyboard.y > 0) keyboard.y = 0;
        break;
      case 83:
        if (keyboard.z < 0) keyboard.z = 0;
        break;
      case 87:
        if (keyboard.z > 0) keyboard.z = 0;
        break;
      default:
        break;
    }
  }

  onPointerLockAttain(movements) {
    const { fullscreen } = this;
    this.isLocked = true;
    window.addEventListener('blur', this.onBlur, false);
    window.addEventListener('mousedown', this.onMouseDown, false);
    window.addEventListener('mouseup', this.onMouseUp, false);
    window.addEventListener('keydown', this.onKeyboardDown, false);
    window.addEventListener('keyup', this.onKeyboardUp, false);
    movements.on('data', this.onPointerMovement.bind(this));
    movements.on('close', this.onPointerLockClose.bind(this));
    fullscreen.request();
  }

  onPointerLockClose() {
    const {
      fullscreen,
      keyboard,
      mouse,
    } = this;
    window.removeEventListener('blur', this.onBlur);
    window.removeEventListener('mousedown', this.onMouseDown);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('keydown', this.onKeyboardDown);
    window.removeEventListener('keyup', this.onKeyboardUp);
    this.isLocked = false;
    fullscreen.release();
    keyboard.set(0, 0, 0);
    mouse.set(0, 0);
  }

  onPointerMovement({ dx, dy }) {
    const { mouse } = this;
    mouse.set(dx, dy);
  }

  setupRaycaster({ camera, raycaster }) {
    const { origin } = this;
    raycaster.setFromCamera(origin, camera);
  }
}

export default DesktopInput;
