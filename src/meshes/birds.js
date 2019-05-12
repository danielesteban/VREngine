import {
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Mesh,
  Object3D,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
  Vector3,
  VertexColors,
} from 'three';

class Birds extends Object3D {
  constructor() {
    if (!Birds.geometry) {
      const geometry = new BufferGeometry();
      /* eslint-disable no-multi-spaces */
      const position = new Float32Array([
        0, 0, -0.5,    0, 0,  0.5,    -1, 1, 0,
        0, 0,  0.5,    0, 0, -0.5,     1, 1, 0,
      ]);
      const bone = new Float32Array([
        0,              0,               1,
        0,              0,               1,
      ]);
      const color = new Float32Array([
        1, 1, 1,         1, 1, 1,        1, 1, 1,
        0.9, 0.9, 0.9,   0.9, 0.9, 0.9,  0.9, 0.9, 0.9,
      ]);
      /* eslint-enable no-multi-spaces */
      geometry.addAttribute('position', new BufferAttribute(position, 3));
      geometry.addAttribute('bone', new BufferAttribute(bone, 1));
      geometry.addAttribute('color', new BufferAttribute(color, 3));
      geometry.computeBoundingSphere();
      Birds.geometry = geometry;
    }
    if (!Birds.material) {
      const vertexShader = ShaderLib.basic.vertexShader.replace(
        '#include <clipping_planes_pars_vertex>',
        [
          '#include <clipping_planes_pars_vertex>',
          'attribute float bone;',
          'uniform float animation;',
        ].join('\n')
      ).replace(
        '#include <skinning_vertex>',
        [
          '#include <skinning_vertex>',
          'if (bone > 0.5) {',
          'transformed.x *= (animation * 0.5) + 0.5;',
          'transformed.y *= (2.0 - (animation * 2.0)) - 1.0;',
          '}',
        ].join('\n')
      );
      Birds.material = new ShaderMaterial({
        name: 'birds-material',
        uniforms: {
          ...UniformsUtils.clone(ShaderLib.basic.uniforms),
          animation: { value: 1 },
          opacity: { value: 0.4 },
        },
        fragmentShader: ShaderLib.basic.fragmentShader,
        vertexShader,
        depthWrite: false,
        fog: true,
        side: DoubleSide,
        transparent: true,
        vertexColors: VertexColors,
      });
    }
    super();
    for (let i = 0; i < Birds.count; i += 1) {
      const mesh = new Mesh(
        Birds.geometry,
        Birds.material
      );
      mesh.position.y = 9999;
      mesh.state = {
        albedo: (new Color()).setHSL(
          Math.random(), 0.6, 0.6
        ),
        origin: new Vector3(),
        target: new Vector3(),
        animation: 0,
        interpolation: 0,
        step: 0,
        velocity: 0,
      };
      mesh.scale.multiplyScalar(0.3 + (Math.random() * 0.6));
      mesh.onBeforeRender = () => {
        Birds.material.uniforms.animation.value = (Math.sin(mesh.state.animation * 3) + 1) * 0.5;
        Birds.material.uniforms.diffuse.value.copy(mesh.state.albedo);
        Birds.material.uniformsNeedUpdate = true;
      };
      this.add(mesh);
    }
    this.origin = new Vector3(0, 0, 0);
    this.onAnimationTick = this.onAnimationTick.bind(this);
  }

  onAnimationTick({ delta }) {
    const {
      children,
      origin,
    } = this;
    children.forEach((bird) => {
      if (bird.position.distanceTo(origin) > 96) {
        bird.state.target.set(
          (Math.random() * 2) - 1,
          0,
          (Math.random() * 2) - 1
        ).normalize().multiplyScalar(64);
        bird.state.target.add(origin);
        /* eslint-disable no-param-reassign */
        bird.state.target.y += 16 + Math.floor(Math.random() * 33);
        bird.position.copy(bird.state.target);
        bird.state.interpolation = 1;
        bird.state.step = 1;
        bird.state.velocity = 1;
        /* eslint-enable no-param-reassign */
      } else {
        // eslint-disable-next-line no-param-reassign
        bird.state.interpolation += bird.state.step * delta;
        if (bird.state.interpolation > 1) {
          bird.state.origin.copy(bird.state.target);
          bird.state.target.set(
            (Math.random() * 2) - 1,
            0,
            (Math.random() * 2) - 1
          ).normalize().multiplyScalar(64);
          bird.state.target.add(origin);
          /* eslint-disable no-param-reassign */
          bird.state.target.y += 16 + Math.floor(Math.random() * 33);
          bird.state.interpolation = 0;
          bird.state.velocity = 1 + Math.random();
          bird.state.step = (
            bird.state.velocity
            / bird.state.origin.distanceTo(bird.state.target)
          );
          /* eslint-enable no-param-reassign */
          bird.lookAt(bird.state.target);
        }
        // eslint-disable-next-line no-param-reassign
        bird.state.animation += bird.state.velocity * delta;
        bird.position.lerpVectors(
          bird.state.origin,
          bird.state.target,
          bird.state.interpolation
        );
      }
    });
  }
}

Birds.count = 64;

export default Birds;
