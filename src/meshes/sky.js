import {
  BackSide,
  Mesh,
  SphereBufferGeometry,
  ShaderLib,
  ShaderMaterial,
  UniformsUtils,
} from 'three';

class Sky extends Mesh {
  constructor() {
    if (!Sky.geometry) {
      Sky.geometry = new SphereBufferGeometry(512, 32, 32);
    }
    if (!Sky.material) {
      const vertexShader = ShaderLib.basic.vertexShader.replace(
        '#include <clipping_planes_pars_vertex>',
        [
          '#include <clipping_planes_pars_vertex>',
          'varying float altitude;',
        ].join('\n')
      ).replace(
        '#include <clipping_planes_vertex>',
        [
          '#include <clipping_planes_vertex>',
          'altitude = clamp(normalize(position).y, 0.0, 1.0);',
        ].join('\n')
      );
      const fragmentShader = ShaderLib.basic.fragmentShader.replace(
        '#include <clipping_planes_pars_fragment>',
        [
          '#include <clipping_planes_pars_fragment>',
          'varying float altitude;',
        ].join('\n')
      ).replace(
        'vec4 diffuseColor = vec4( diffuse, opacity );',
        'vec4 diffuseColor = vec4(mix(diffuse, diffuse * 0.5, altitude), opacity);'
      );
      Sky.material = new ShaderMaterial({
        name: 'sky-material',
        uniforms: UniformsUtils.clone(ShaderLib.basic.uniforms),
        fragmentShader,
        vertexShader,
        depthWrite: false,
        side: BackSide,
      });
    }
    super(
      Sky.geometry,
      Sky.material
    );
    this.material.color = this.material.uniforms.diffuse.value;
  }
}

export default Sky;
