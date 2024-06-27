// varying vec2 vUv;
// varying vec3 vColor;

// void main(){
//   vUv = uv;
//     float height = position.y;
//   vColor = vec3(0.0, height, 0.0); // 高さに応じて緑色の強さを変える
  
//   vec4 mvMatrix = modelViewMatrix * vec4(position,1.0);
//   gl_Position = projectionMatrix*mvMatrix;
// }

varying vec2 vUv;

varying vec3 vColor;
uniform float uTime;

void main() {
  vUv = uv;
  vColor = color;
  vec3 cpos = position;

  float waveSize = 1.0f;
  float tipDistance = 0.3f;
  float centerDistance = 0.1f;

  if (color.x > 0.6f) {
    cpos.x += fract((uTime / 50000.) + (uv.x * waveSize)) * tipDistance;
  }else if (color.x > 0.0f) {
    cpos.x += fract((uTime / 50000.) + (uv.x * waveSize)) * centerDistance;
  }

  float diff = position.x - cpos.x;

  vec4 worldPosition = vec4(cpos, 1.);
  vec4 mvPosition = projectionMatrix * modelViewMatrix * vec4(cpos, 1.0);
  gl_Position = mvPosition;
}