/** Outils Three.js propres à Racer : voiture, panneaux et texture des portes. */
import type { GateOption } from './engine';

type ThreeApi = any;

function addBox(
  three: ThreeApi,
  parent: any,
  geometry: any,
  material: any,
  position: [number, number, number],
  rotation: [number, number, number] = [0, 0, 0]
) {
  const mesh = new three.Mesh(geometry, material);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.rotation.set(rotation[0], rotation[1], rotation[2]);
  mesh.castShadow = false;
  mesh.receiveShadow = false;
  parent.add(mesh);
  return mesh;
}

/** Construit la voiture de Racer et renvoie son groupe pour que la page le déplace. */
export function createRaceCar(three: ThreeApi, laneX: number) {
  const carGroup = new three.Group();
  const bodyRed = new three.MeshStandardMaterial({ color: 0xff185d, emissive: 0x4a0019, emissiveIntensity: 0.5, metalness: 0.55, roughness: 0.25 });
  const bodyDark = new three.MeshStandardMaterial({ color: 0x17172a, metalness: 0.35, roughness: 0.45 });
  const glass = new three.MeshStandardMaterial({ color: 0x10eaff, emissive: 0x007b91, emissiveIntensity: 0.65, metalness: 0.3, roughness: 0.18 });
  const neon = new three.MeshStandardMaterial({ color: 0x00f0ff, emissive: 0x00b6cc, emissiveIntensity: 1.2, metalness: 0.1, roughness: 0.25 });
  const headlight = new three.MeshBasicMaterial({ color: 0xfff2ad });
  const tailLight = new three.MeshBasicMaterial({ color: 0xff0050 });
  const tireMat = new three.MeshStandardMaterial({ color: 0x080a12, roughness: 0.9 });
  const hubMat = new three.MeshStandardMaterial({ color: 0x8cfaff, emissive: 0x00f0ff, emissiveIntensity: 0.4, metalness: 0.8, roughness: 0.25 });

  // Châssis et carrosserie : la face avant de la voiture regarde vers -Z.
  addBox(three, carGroup, new three.BoxGeometry(1.55, 0.28, 2.85), bodyDark, [0, 0.28, 0.02]);
  addBox(three, carGroup, new three.BoxGeometry(1.45, 0.48, 1.35), bodyRed, [0, 0.52, -0.62]);
  addBox(three, carGroup, new three.BoxGeometry(1.52, 0.38, 0.86), bodyRed, [0, 0.47, 0.83]);
  addBox(three, carGroup, new three.BoxGeometry(1.28, 0.12, 0.82), bodyRed, [0, 0.80, -0.67]);

  // Cockpit vitré et pare-brise incliné.
  addBox(three, carGroup, new three.BoxGeometry(1.08, 0.48, 1.12), glass, [0, 0.88, 0.02], [-0.05, 0, 0]);
  addBox(three, carGroup, new three.BoxGeometry(1.0, 0.07, 0.08), neon, [0, 1.13, -0.48], [-0.18, 0, 0]);
  addBox(three, carGroup, new three.BoxGeometry(0.9, 0.07, 0.08), neon, [0, 1.12, 0.52], [0.18, 0, 0]);

  // Aileron arrière et éléments lumineux latéraux.
  addBox(three, carGroup, new three.BoxGeometry(0.12, 0.27, 0.12), bodyDark, [-0.52, 0.77, 1.22]);
  addBox(three, carGroup, new three.BoxGeometry(0.12, 0.27, 0.12), bodyDark, [0.52, 0.77, 1.22]);
  addBox(three, carGroup, new three.BoxGeometry(1.72, 0.10, 0.24), bodyDark, [0, 0.91, 1.22]);
  addBox(three, carGroup, new three.BoxGeometry(0.05, 0.06, 1.65), neon, [-0.77, 0.43, 0.03]);
  addBox(three, carGroup, new three.BoxGeometry(0.05, 0.06, 1.65), neon, [0.77, 0.43, 0.03]);

  // Phares et feux arrière facilitent la lecture de l’orientation du véhicule.
  addBox(three, carGroup, new three.BoxGeometry(0.30, 0.12, 0.06), headlight, [-0.48, 0.58, -1.31]);
  addBox(three, carGroup, new three.BoxGeometry(0.30, 0.12, 0.06), headlight, [0.48, 0.58, -1.31]);
  addBox(three, carGroup, new three.BoxGeometry(0.33, 0.12, 0.06), tailLight, [-0.48, 0.54, 1.27]);
  addBox(three, carGroup, new three.BoxGeometry(0.33, 0.12, 0.06), tailLight, [0.48, 0.54, 1.27]);

  // Quatre pneus et moyeux visibles même sur petit écran.
  const tireGeometry = new three.CylinderGeometry(0.31, 0.31, 0.24, 10);
  const hubGeometry = new three.CylinderGeometry(0.15, 0.15, 0.255, 8);
  for (const x of [-0.82, 0.82]) {
    for (const z of [-0.83, 0.83]) {
      const wheel = new three.Mesh(tireGeometry, tireMat);
      wheel.rotation.z = Math.PI / 2;
      wheel.position.set(x, 0.30, z);
      wheel.castShadow = false;
      carGroup.add(wheel);
      const hub = new three.Mesh(hubGeometry, hubMat);
      hub.rotation.z = Math.PI / 2;
      hub.position.set(x * 1.015, 0.30, z);
      carGroup.add(hub);
    }
  }

  carGroup.position.set(laneX, 0, 0);
  carGroup.traverse((child: any) => {
    if (child.isMesh) child.frustumCulled = false;
  });
  return carGroup;
}

/** Dessine une texture Canvas lisible pour le texte de chaque porte. */
export function createGateTexture(three: ThreeApi, text: string) {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Impossible de créer le panneau de réponse.');

  ctx.fillStyle = '#090d22';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#111b38';
  ctx.fillRect(28, 28, 456, 456);
  ctx.lineWidth = 18;
  ctx.strokeStyle = '#00eaff';
  ctx.shadowColor = '#00eaff';
  ctx.shadowBlur = 22;
  ctx.strokeRect(18, 18, 476, 476);
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#f02bff';
  ctx.fillRect(38, 40, 44, 8);
  ctx.fillRect(430, 464, 44, 8);
  ctx.fillStyle = '#ffffff';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.font = 'bold 118px "Oxanium", sans-serif';
  ctx.shadowColor = '#00eaff';
  ctx.shadowBlur = 12;

  // Réduit la police si une réponse longue dépasserait du panneau.
  let fontSize = 118;
  while (ctx.measureText(text).width > 400 && fontSize > 56) {
    fontSize -= 6;
    ctx.font = `bold ${fontSize}px "Oxanium", sans-serif`;
  }
  ctx.fillText(text, 256, 260, 410);
  ctx.shadowBlur = 0;

  const texture = new three.CanvasTexture(canvas);
  if ('colorSpace' in texture && three.SRGBColorSpace) texture.colorSpace = three.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

/** Ajoute le cadre et le panneau d’une réponse à une porte de la piste. */
export function createGatePanel(
  three: ThreeApi,
  gateGroup: any,
  lane: number,
  option: GateOption,
  lanePositions: number[]
) {
  const laneColor = lane === 1 ? 0x00eaff : lane === 0 ? 0xf02bff : 0xffc857;
  const frameMaterial = new three.MeshBasicMaterial({ color: laneColor });
  const postGeometry = new three.BoxGeometry(0.13, 3.18, 0.16);
  const topGeometry = new three.BoxGeometry(2.72, 0.14, 0.16);
  const panelGeometry = new three.PlaneGeometry(2.42, 2.52);
  const left = new three.Mesh(postGeometry, frameMaterial);
  left.position.set(lanePositions[lane] - 1.31, 1.62, 0);
  const right = new three.Mesh(postGeometry, frameMaterial);
  right.position.set(lanePositions[lane] + 1.31, 1.62, 0);
  const top = new three.Mesh(topGeometry, frameMaterial);
  top.position.set(lanePositions[lane], 3.20, 0);
  const texture = createGateTexture(three, option.text);
  const panelMaterial = new three.MeshBasicMaterial({ map: texture, side: three.DoubleSide });
  const panel = new three.Mesh(panelGeometry, panelMaterial);
  panel.position.set(lanePositions[lane], 1.68, 0.09);
  panel.userData = { isQuestionPanel: true, isCorrect: option.isCorrect, lane };
  gateGroup.add(left, right, top, panel);
}
