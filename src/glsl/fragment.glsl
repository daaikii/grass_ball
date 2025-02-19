// fragment.glsl

varying vec3 vColor;
varying vec2 vUv;

uniform sampler2D uTexture;

void main() {
  vec3 color = texture2D(uTexture,vUv).rgb;
  gl_FragColor = vec4(color, 1.0);
}