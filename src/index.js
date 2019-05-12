
import {
  Audio,
  AudioListener,
  AudioLoader,
  Clock,
  FogExp2,
  Raycaster,
  ShaderChunk,
  WebGLRenderer,
} from 'three';
import Camera from './camera';
import DesktopInput from './input/desktop';
import HandsInput from './input/hands';
import Marker from './meshes/marker';
import Router from './router';
import Sky from './meshes/sky';

class Engine {
  constructor({
    basename,
    mount,
    scenes,
  }) {
    // Setup audio
    this.ambient = [];
    this.listener = new AudioListener();

    // Setup renderer
    this.clock = new Clock();
    this.mount = mount;
    this.raycaster = new Raycaster();
    this.raycaster.far = 20;
    const renderer = new WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
      stencil: false,
    });
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.setAnimationLoop(this.onAnimationTick.bind(this));
    this.camera = new Camera();
    this.camera.add(this.listener);
    this.fog = new FogExp2(0, 0.015);
    this.renderer = renderer;
    this.sky = new Sky();
    mount.appendChild(renderer.domElement);
    window.addEventListener('resize', this.onResize.bind(this), false);
    this.onResize();

    // Setup Input
    this.input = {
      desktop: new DesktopInput({ mount }),
      hands: new HandsInput({ standingMatrix: renderer.vr.getStandingMatrix() }),
    };
    this.camera.room.add(this.input.hands);

    // Setup translocation marker
    this.marker = new Marker();

    // Setup VR
    if ('getVRDisplays' in navigator) {
      const enterVR = () => {
        if (renderer.vr.isPresenting()) return;
        const display = renderer.vr.getDevice();
        if (!display) {
          navigator.getVRDisplays().then((displays) => {
            if (!displays.length) return;
            const [display] = displays;
            renderer.vr.enabled = true;
            renderer.vr.setDevice(display);
          });
          return;
        }
        display.requestPresent([{ source: renderer.domElement }]);
      };
      window.addEventListener('mousedown', enterVR, false);
      window.addEventListener('vrdisplayactivate', enterVR, false);
      enterVR();
    }

    // Setup browser router
    this.router = new Router({
      basename,
      scenes,
      onUpdate: this.onRouterUpdate.bind(this),
    });
  }

  onAnimationTick() {
    const {
      camera,
      clock,
      input,
      renderer,
      scene,
    } = this;
    renderer.animation = {
      delta: clock.getDelta(),
      time: clock.oldTime / 1000,
    };
    if (!renderer.vr.enabled) {
      camera.processInput({
        animation: renderer.animation,
        input: input.desktop,
      });
    }
    camera.onAnimationTick(renderer.animation);
    scene.animations.forEach(animate => animate(renderer.animation));
    renderer.render(scene, camera);
  }

  onBeforeRender(renderer, scene, camera) {
    const {
      input,
      marker,
      raycaster,
    } = this;
    let inputs;
    if (renderer.vr.enabled) {
      input.hands.update();
      inputs = input.hands.children;
    } else {
      inputs = [input.desktop];
    }
    marker.visible = false;
    inputs.forEach((input) => {
      input.setupRaycaster({ camera, raycaster });
      const hit = raycaster.intersectObjects(scene.intersects)[0] || false;
      if (!hit) {
        if (input.pointer) {
          input.pointer.visible = false;
        }
        return;
      }
      if (input.pointer) {
        input.pointer.visible = true;
        input.pointer.scale.z = hit.distance;
      }
      const { buttons } = input;
      const { object, point } = hit;
      if (object.onPointer) {
        if (buttons.primaryUp || buttons.secondaryUp) {
          object.onPointer({ hit, isPrimary: buttons.primaryUp });
        }
      } else if (object.isTranslocable) {
        if (buttons.primaryUp) {
          const { room, worldPosition } = this.camera;
          worldPosition.setFromMatrixPosition(camera.matrixWorld);
          point.x -= worldPosition.x - room.position.x;
          point.z -= worldPosition.z - room.position.z;
          this.camera.setDestination(point);
          marker.visible = false;
        } else if (buttons.primary) {
          marker.position.copy(point);
          marker.updateWorldMatrix();
          marker.visible = true;
        }
      } else if (scene.processInput) {
        scene.processInput({ hit, input });
      }
    });
    inputs.forEach((input) => {
      ['primary', 'secondary'].forEach(button => ['Down', 'Up'].forEach((suffix) => {
        input.buttons[`${button}${suffix}`] = false;
      }));
    });
  }

  onResize() {
    const {
      camera,
      mount,
      renderer,
    } = this;
    const { width, height } = mount.getBoundingClientRect();
    this.width = width;
    this.height = height;
    if (!renderer.vr.isPresenting()) {
      renderer.setSize(width, height);
    }
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  onRouterUpdate(Scene, args) {
    const {
      camera,
      fog,
      marker,
      scene,
      sky,
    } = this;
    if (scene) {
      scene.dispose();
    }
    camera.reset();
    this.setAmbientSounds([]);
    this.setBackgroundColor(0);
    this.scene = new Scene({
      ...args,
      engine: this,
      fog,
      marker,
      onBeforeRender: this.onBeforeRender.bind(this),
      room: camera.room,
      sky,
    });
  }

  setAmbientSounds(sounds) {
    const { ambient, listener } = this;
    ambient.forEach((ambient) => {
      if (ambient.isPlaying) {
        ambient.stop();
      }
    });
    const audioLoader = new AudioLoader();
    this.ambient = sounds.map((ambient) => {
      const file = ambient.file || ambient;
      const volume = ambient.volume || 0.25;
      const sound = new Audio(listener);
      sound.setLoop(true);
      sound.setVolume(volume);
      audioLoader.load(file, (buffer) => {
        sound.setBuffer(buffer);
        sound.play();
      });
      return sound;
    });
  }

  setBackgroundColor(color) {
    const { fog, renderer, sky } = this;
    fog.color.setHex(color);
    sky.material.color.copy(fog.color);
    renderer.setClearColor(fog.color);
  }
}

// Tweak ThreeJS Fog
ShaderChunk.fog_vertex = ShaderChunk.fog_vertex.replace(
  'fogDepth = -mvPosition.z;',
  'fogDepth = length(mvPosition);'
);

export default args => new Engine(args);
export { default as Scene } from './scene';
export { default as Birds } from './meshes/birds';
export { default as Floor } from './meshes/floor';
export { default as Heightmap } from './meshes/heightmap';
export { default as Marker } from './meshes/marker';
export { default as Sky } from './meshes/sky';
export { default as Starfield } from './meshes/starfield';
export { default as UI } from './meshes/ui';
export { default as Voxels } from './meshes/voxels';
export { default as Water } from './meshes/water';
