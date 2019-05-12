import {
  BufferGeometry,
  CanvasTexture,
  Mesh,
  MeshBasicMaterial,
  PlaneGeometry,
  Vector3,
} from 'three';

class UI extends Mesh {
  constructor({
    buttons = [],
    graphics = [],
    labels = [],
    width = 0.4,
    height = 0.4,
    styles = {},
    textureWidth = 256,
    textureHeight = 256,
  }) {
    if (!UI.geometry) {
      const geometry = new PlaneGeometry(1, 1);
      geometry.merge(geometry.clone().rotateY(Math.PI));
      UI.geometry = (new BufferGeometry()).fromGeometry(geometry);
    }
    styles = {
      background: 'rgba(0, 0, 0, .5)',
      color: '#fff',
      font: '700 30px monospace',
      textAlign: 'center',
      textBaseline: 'middle',
      ...styles,
      button: {
        background: '#222',
        border: '#000',
        color: '#fff',
        ...(styles.button || {}),
        disabled: {
          background: '#555',
          border: '#000',
          color: '#777',
          ...(styles.button && styles.button.disabled ? styles.button.disabled : {}),
        },
      },
    };
    const renderer = document.createElement('canvas');
    renderer.width = textureWidth;
    renderer.height = textureHeight;
    const texture = new CanvasTexture(renderer);
    texture.anisotropy = 16;
    super(
      UI.geometry,
      new MeshBasicMaterial({
        map: texture,
        transparent: true,
      })
    );
    this.scale.set(width, height, 1);
    this.buttons = buttons;
    this.graphics = graphics;
    this.labels = labels;
    this.context = renderer.getContext('2d');
    this.pointer = new Vector3();
    this.renderer = renderer;
    this.styles = styles;
    this.texture = texture;
    this.draw();
  }

  dispose() {
    const { material, texture } = this;
    material.dispose();
    texture.dispose();
  }

  draw() {
    const {
      buttons,
      graphics,
      labels,
      context: ctx,
      renderer,
      styles,
      texture,
    } = this;
    ctx.fillStyle = styles.background;
    ctx.fillRect(0, 0, renderer.width, renderer.height);
    graphics.forEach((draw) => {
      ctx.save();
      draw({ ctx, styles });
      ctx.restore();
    });
    buttons.forEach(({
      label,
      x,
      y,
      width,
      height,
      background,
      border,
      color,
      font,
      textAlign,
      textBaseline,
      isDisabled,
    }) => {
      const button = isDisabled ? styles.button.disabled : styles.button;
      ctx.save();
      ctx.translate(x, y);
      ctx.beginPath();
      ctx.rect(0, 0, width, height);
      ctx.fillStyle = background || button.background || styles.background;
      ctx.strokeStyle = border || button.border || styles.border;
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = color || button.color || styles.color;
      ctx.font = font || button.font || styles.font;
      ctx.textAlign = textAlign || button.textAlign || styles.textAlign;
      ctx.textBaseline = textBaseline || button.textBaseline || styles.textBaseline;
      ctx.fillText(
        label,
        width * 0.5,
        height * 0.5
      );
      ctx.restore();
    });
    labels.forEach(({
      x,
      y,
      color,
      font,
      text,
      textAlign,
      textBaseline,
    }) => {
      ctx.save();
      ctx.fillStyle = color || styles.color;
      ctx.font = font || styles.font;
      ctx.textAlign = textAlign || styles.textAlign;
      ctx.textBaseline = textBaseline || styles.textBaseline;
      ctx.fillText(text, x, y);
      ctx.restore();
    });
    texture.needsUpdate = true;
  }

  onPointer({ hit: { point }, isPrimary }) {
    const { buttons, pointer, renderer } = this;
    this.worldToLocal(pointer.copy(point));
    pointer.set(
      (pointer.x + 0.5) * renderer.width,
      (1 - (pointer.y + 0.5)) * renderer.height,
      0
    );
    buttons
      .filter(({ isDisabled }) => (!isDisabled))
      .forEach(({
        x,
        y,
        width,
        height,
        onPointer,
      }) => {
        if (
          pointer.x < x
          || pointer.x > x + width
          || pointer.y < y
          || pointer.y > y + height
        ) {
          return;
        }
        onPointer({ isPrimary });
      });
  }
}

export default UI;
