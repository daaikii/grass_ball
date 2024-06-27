import * as THREE from "three";
import Stats from 'three/examples/jsm/libs/stats.module';
import GUI from "lil-gui";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import groundImage from "/grass.jpg"
import grassImage from "/grass-field.jpg"

import vertex from "../glsl/vertex.glsl";
import fragment from "../glsl/fragment.glsl";

export default class Canvas {
  private static _instance: Canvas | null;
  private canvas: HTMLCanvasElement | null;
  private scene: THREE.Scene;


  private settings: {};
  private gui: GUI;

  private size: { width: number; height: number };
  private aspectRatio: number;
  private perspective: number;
  private fov: number;
  private camera: THREE.PerspectiveCamera;
  private renderer: THREE.WebGLRenderer;
  private orbitControls: OrbitControls;
  private stats: Stats;

  constructor() {
    this.canvas = document.getElementById("canvas") as HTMLCanvasElement;
    this.scene = new THREE.Scene();

    this.setDimension();
    this.setGUI();
    this.setupRenderer();
    this.resize();
    this.createMesh();
    this.animate();
  }

  static get instance() {
    if (!this._instance) {
      this._instance = new Canvas();
    }
    return this._instance;
  }

  private setDimension(): void {
    this.size = {
      width: window.innerWidth,
      height: window.innerHeight,
    };
    this.aspectRatio = this.size.width / this.size.height;
  }

  private setGUI(): void {
    this.settings = {
      progress: 0
    };
    this.gui = new GUI();
  }

  private setupRenderer(): void {
    this.perspective = 10;
    this.fov = 50;
    this.camera = new THREE.PerspectiveCamera(this.fov, this.aspectRatio, 0.1, 1000);
    this.camera.position.z = this.perspective;
    this.scene.add(this.camera);

    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas!,
      alpha: true,
      antialias: true,
    });
    this.renderer.setSize(this.size.width, this.size.height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    this.orbitControls = new OrbitControls(this.camera, this.renderer.domElement);
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.domElement);
  }

  private resize(): void {
    window.addEventListener("resize", () => {
      this.setDimension();
      this.camera.aspect = this.aspectRatio;
      this.camera.updateProjectionMatrix();

      this.renderer.setSize(this.size.width, this.size.height);
      this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    });
  }


  private createMesh(): void {
    const loader = new THREE.TextureLoader()
    const groundTex = loader.load(groundImage)
    const surfaceGeo = new THREE.SphereGeometry(15, 32, 16)
    const surfaceMat = new THREE.MeshBasicMaterial({ map: groundTex })
    const mesh = new THREE.Mesh(surfaceGeo, surfaceMat)
    this.scene.add(mesh);

    const grassTex = loader.load(grassImage)
    this.myMesh = new MyMesh(grassTex);
    this.scene.add(this.myMesh.mesh);
  }

  progress = 0;
  clock = new THREE.Clock()
  private animate(): void {
    this.stats.begin();
    this.myMesh.grassMaterial.uniforms.uTime.value = this.progress;
    this.stats.end();
    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
    this.progress += this.clock.getElapsedTime();
  }
}












/*FirstMesh------------------------------------------------------------------------- */
class MyMesh {
  private PLANE_SIZE: number;
  private BLADE_COUNT: number;
  private BLADE_WIDTH: number;
  private BLADE_HEIGHT: number;
  private BLADE_HEIGHT_VARIATION: number;

  private grassTex: THREE.Texture
  public grassMaterial: THREE.ShaderMaterial;
  public mesh: THREE.Mesh;

  constructor(grassTex: THREE.Texture) {
    this.PLANE_SIZE = 30;
    this.BLADE_COUNT = 1000000;
    this.BLADE_WIDTH = 0.05;
    this.BLADE_HEIGHT = 1.;
    this.BLADE_HEIGHT_VARIATION = 1.0;

    this.grassTex = grassTex;

    this.generateField();
  }

  private generateField() {
    const positions = [];
    const uvs = [];
    const indices = [];
    const colors = [];

    this.grassMaterial = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: this.grassTex },
        uTime: { value: 0 }
      },
      vertexShader: vertex,
      fragmentShader: fragment,
      vertexColors: true,
      side: THREE.DoubleSide
    });

    for (let i = 0; i < this.BLADE_COUNT; i++) {
      const VERTEX_COUNT = 5;
      const surfaceMin = this.PLANE_SIZE / 2 * -1;
      const surfaceMax = this.PLANE_SIZE / 2;
      const radius = this.PLANE_SIZE / 2;

      const r = radius;
      const theta = Math.random() * 2 * Math.PI;
      const phi = Math.random() * Math.PI;
      const x = r * Math.sin(theta) * Math.cos(phi);
      const y = r * Math.sin(theta) * Math.sin(phi);
      const z = r * Math.cos(theta);

      const pos = new THREE.Vector3(x, y, z);
      const normal = pos.clone().normalize();

      const uv = [this.convertRange(pos.x, surfaceMin, surfaceMax, 0, 1), this.convertRange(pos.y, surfaceMin, surfaceMax, 0, 1)];

      const blade = this.generateBlade(pos, normal, i * VERTEX_COUNT, uv);
      blade.verts.forEach(vert => {
        positions.push(...vert.pos);
        uvs.push(...vert.uv);
        colors.push(...vert.color);
      });
      blade.indices.forEach(bladeIndices => indices.push(bladeIndices));
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute('position', new THREE.BufferAttribute(new Float32Array(positions), 3));
    geom.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uvs), 2));
    geom.setAttribute('color', new THREE.BufferAttribute(new Float32Array(colors), 3));
    geom.setIndex(indices);
    geom.computeVertexNormals();

    this.mesh = new THREE.Mesh(geom, this.grassMaterial);
  }

  private convertRange(val, oldMin, oldMax, newMin, newMax) {
    return (((val - oldMin) * (newMax - newMin)) / (oldMax - oldMin)) + newMin;
  }

  private generateBlade(center, normal, vArrOffset, uv) {
    const MID_WIDTH = this.BLADE_WIDTH * 0.5;
    const TIP_OFFSET = 0.1;
    const height = this.BLADE_HEIGHT + (Math.random() * this.BLADE_HEIGHT_VARIATION);

    const yaw = Math.random() * Math.PI * 2;
    const yawUnitVec = new THREE.Vector3(Math.sin(yaw), 0, -Math.cos(yaw));
    const tipBend = Math.random() * Math.PI * 2;
    const tipBendUnitVec = new THREE.Vector3(Math.sin(tipBend), 0, -Math.cos(tipBend));

    const up = normal;
    const right = new THREE.Vector3().crossVectors(up, yawUnitVec).normalize();
    const forward = new THREE.Vector3().crossVectors(right, up).normalize();

    // Find the Bottom Left, Bottom Right, Top Left, Top right, Top Center vertex positions
    const bl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(right).multiplyScalar((this.BLADE_WIDTH / 2) * 1));
    const br = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(right).multiplyScalar((this.BLADE_WIDTH / 2) * -1));
    const tl = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(right).multiplyScalar((MID_WIDTH / 2) * 1));
    const tr = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(right).multiplyScalar((MID_WIDTH / 2) * -1));
    const tc = new THREE.Vector3().addVectors(center, new THREE.Vector3().copy(tipBendUnitVec).multiplyScalar(TIP_OFFSET));

    tl.add(new THREE.Vector3().copy(up).multiplyScalar(height / 2));
    tr.add(new THREE.Vector3().copy(up).multiplyScalar(height / 2));
    tc.add(new THREE.Vector3().copy(up).multiplyScalar(height));

    // Vertex Colors
    const black = [0, 0, 0];
    const gray = [0.5, 0.5, 0.5];
    const white = [1.0, 1.0, 1.0];

    const verts = [
      { pos: bl.toArray(), uv: uv, color: black },
      { pos: br.toArray(), uv: uv, color: black },
      { pos: tr.toArray(), uv: uv, color: gray },
      { pos: tl.toArray(), uv: uv, color: gray },
      { pos: tc.toArray(), uv: uv, color: white }
    ];

    const indices = [
      vArrOffset,
      vArrOffset + 1,
      vArrOffset + 2,
      vArrOffset + 2,
      vArrOffset + 4,
      vArrOffset + 3,
      vArrOffset + 3,
      vArrOffset,
      vArrOffset + 2
    ];

    return { verts, indices };
  }

  public update() {
    this.grassMaterial.uniforms.uTime.value += 0.1;
  }
}
