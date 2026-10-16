import * as THREE from "three";

/*
 * A virtual photo studio, built in code.
 *
 * Shiny metal has almost no color of its own. What you see is a mirror image
 * of its surroundings. Product photographers light watches with big softboxes
 * and long strip lights, because those create the crisp bright bands that sweep
 * across the metal edges. That's the look that reads as "real".
 *
 * So we build a tiny invisible scene: a dark room with a few glowing
 * rectangles (our softboxes). Three.js "photographs" it from the center into
 * an environment map, and every material on the watch reflects it.
 *
 * Built in code means 0 KB to download, versus 2–20 MB for a .hdr studio photo.
 */
export function createStudioEnvironment(renderer: THREE.WebGLRenderer) {
  const studio = new THREE.Scene();
  studio.background = new THREE.Color("#2a2d35"); // dim grey room: gives the metal a base tone between highlights

  const panel = (w: number, h: number, position: [number, number, number], intensity: number, color = "#ffffff") => {
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, h),
      // Brighter than white (intensity > 1) so the reflection is a true highlight.
      new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(intensity), side: THREE.DoubleSide, toneMapped: false })
    );
    mesh.position.set(...position);
    mesh.lookAt(0, 0, 0); // face the watch
    studio.add(mesh);
  };

  panel(7, 2.5, [0, 5, 3], 3); // big overhead softbox: broad soft highlight on top
  panel(0.8, 8, [-5, 0.5, 2.5], 4.5); // tall strip light, left: long crisp edge highlight
  panel(0.8, 8, [5, -0.5, 1.5], 4); // tall strip light, right
  // Two front softboxes placed off to the sides (not straight in front),
  // so they light the metal without a big glare rectangle over the screen.
  panel(3, 4, [-4, 1.5, 5], 2.2);
  panel(3, 4, [4.5, -1, 5], 1.6);
  panel(5, 1.2, [0, -3, 5], 1.2); // low front fill, so the underside isn't pitch black
  panel(4, 4, [0, 1, -6], 0.8); // back panel: subtle rim on the far edges
  panel(3, 3, [-4, -3, -3], 1.6, "#00e0c6"); // teal kicker, ties into the brand color

  const pmrem = new THREE.PMREMGenerator(renderer);
  const envMap = pmrem.fromScene(studio, 0.02).texture;

  // The studio scene was only needed for the snapshot, so free it right away.
  studio.traverse((o) => {
    if (o instanceof THREE.Mesh) {
      o.geometry.dispose();
      (o.material as THREE.Material).dispose();
    }
  });
  pmrem.dispose();

  return envMap;
}
