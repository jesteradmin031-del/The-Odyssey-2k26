import { useEffect, useRef, useState } from 'react';
import { Pause, Play, Navigation, Sparkles } from 'lucide-react';

export default function CityScene() {
  const host = useRef(null),
    pausedRef = useRef(false);
  const [failed, setFailed] = useState(false),
    [paused, setPaused] = useState(
      () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    );
  pausedRef.current = paused;
  useEffect(() => {
    let disposed = false,
      cleanup = () => {};
    import('three')
      .then((THREE) => {
        if (disposed) return;
        let renderer;
        try {
          renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'low-power',
          });
        } catch {
          setFailed(true);
          return;
        }
        const scene = new THREE.Scene();
        const camera = new THREE.OrthographicCamera(-8, 8, 8, -8, 0.1, 100);
        camera.position.set(13, 14, 17);
        camera.lookAt(0, 0, 0);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.setClearColor(0x000000, 0);
        host.current.appendChild(renderer.domElement);
        renderer.domElement.setAttribute(
          'aria-label',
          'Animated 3D city with buildings, trees and a glowing travel route',
        );
        renderer.domElement.setAttribute('role', 'img');
        scene.add(new THREE.HemisphereLight(0xffffff, 0x789b83, 3));
        const sun = new THREE.DirectionalLight(0xffffff, 3.5);
        sun.position.set(-8, 16, 9);
        sun.castShadow = true;
        sun.shadow.mapSize.set(1024, 1024);
        sun.shadow.camera.left = -12;
        sun.shadow.camera.right = 12;
        sun.shadow.camera.top = 12;
        sun.shadow.camera.bottom = -12;
        sun.shadow.normalBias = 0.04;
        scene.add(sun);
        const city = new THREE.Group();
        city.rotation.y = -0.22;
        scene.add(city);
        const material = (color) =>
          new THREE.MeshStandardMaterial({ color, roughness: 0.72, metalness: 0.03 });
        const cream = material('#f0efdd'),
          road = material('#cfddc6'),
          green = material('#245d49'),
          mint = material('#b0c9ac'),
          pale = material('#dde5cf'),
          yellow = material('#f4d17c'),
          windowMat = material('#6d9984');
        function box(w, h, d, x, y, z, mat) {
          const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat);
          mesh.position.set(x, y, z);
          mesh.castShadow = true;
          mesh.receiveShadow = true;
          city.add(mesh);
          return mesh;
        }
        box(11, 0.42, 9, 0, -0.3, 0, green);
        box(11, 0.12, 9, 0, -0.03, 0, cream);
        [-3, 0, 3].forEach((x) => box(0.55, 0.025, 8.9, x, 0.055, 0, road));
        [-3, 0, 3].forEach((z) => box(10.9, 0.025, 0.55, 0, 0.06, z, road));
        // Small repeated geometry forms a city; no external 3D assets are required.
        const buildings = [
          [-4.25, -1.7, 1.6],
          [-1.6, -1.6, 2.8],
          [1.5, -1.5, 1.7],
          [4.2, -1.6, 2.3],
          [-4.2, 1.5, 1.1],
          [-1.5, 1.5, 1.8],
          [4.2, 1.5, 1.5],
          [-1.6, -3.8, 0.8],
          [1.5, -3.8, 1.1],
          [4.2, -3.8, 0.7],
          [-4.2, 3.8, 0.8],
          [-1.5, 3.8, 0.6],
        ];
        buildings.forEach(([x, z, h], i) => {
          box(1.45, h, 1.3, x, h / 2 + 0.1, z, i % 3 === 0 ? green : i % 3 === 1 ? mint : pale);
          box(1.54, 0.09, 1.38, x, h + 0.14, z, cream);
          for (let row = 0.45; row < h; row += 0.55) {
            [-0.38, 0.15].forEach((dx) =>
              box(0.23, 0.25, 0.035, x + dx, row, z + 0.67, i % 3 === 0 ? yellow : windowMat),
            );
          }
        });
        box(1.9, 0.08, 1.9, 1.5, 0.1, 1.5, mint);
        function tree(x, z, size = 1) {
          box(0.09, 0.46, 0.09, x, 0.3, z, material('#9c8564'));
          const leaf = new THREE.Mesh(new THREE.IcosahedronGeometry(0.39 * size, 1), green);
          leaf.position.set(x, 0.6 + 0.15 * size, z);
          leaf.castShadow = true;
          city.add(leaf);
        }
        [
          [0.9, 1],
          [1.7, 1],
          [2, 2],
          [0.8, 2],
          [-4.6, -3.8],
          [-3.7, -3.9],
          [4.6, 3.8],
          [3.8, 3.7],
          [-4.8, 0.5],
          [-4.9, 2.5],
        ].forEach(([x, z], i) => tree(x, z, 1 + (i % 2) * 0.25));
        const routePoints = [
          [-4.7, 0.16, 3],
          [-3, 0.16, 3],
          [-3, 0.16, 0],
          [0, 0.16, 0],
          [0, 0.16, -3],
          [3.6, 0.16, -3],
        ].map((p) => new THREE.Vector3(...p));
        const path = new THREE.CurvePath();
        for (let i = 1; i < routePoints.length; i++)
          path.add(new THREE.LineCurve3(routePoints[i - 1], routePoints[i]));
        const tube = new THREE.Mesh(new THREE.TubeGeometry(path, 100, 0.085, 8, false), yellow);
        city.add(tube);
        const traveler = new THREE.Mesh(
          new THREE.SphereGeometry(0.15, 16, 16),
          material('#ffffff'),
        );
        city.add(traveler);
        const pinMaterial = material('#dc825c');
        const pins = [];
        [
          [-4.7, 3, green],
          [3.6, -3, pinMaterial],
        ].forEach(([x, z, mat]) => {
          const pin = new THREE.Group();
          pin.position.set(x, 1.4, z);
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.14, 12, 28), mat);
          pin.add(ring);
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.24, 0.46, 4), mat);
          tip.rotation.z = Math.PI;
          tip.position.y = -0.44;
          pin.add(tip);
          city.add(pin);
          pins.push(pin);
          const halo = new THREE.Mesh(new THREE.TorusGeometry(0.45, 0.025, 8, 40), mat);
          halo.rotation.x = -Math.PI / 2;
          halo.position.set(x, 0.18, z);
          city.add(halo);
        });
        const ground = new THREE.Mesh(
          new THREE.PlaneGeometry(200, 200),
          new THREE.ShadowMaterial({ opacity: 0.13 }),
        );
        ground.rotation.x = -Math.PI / 2;
        ground.position.y = -1.05;
        ground.receiveShadow = true;
        scene.add(ground);
        let pointerX = 0,
          pointerY = 0,
          frame = 0,
          phase = 0,
          last = 0;
        function onPointer(e) {
          const r = host.current.getBoundingClientRect();
          pointerX = (e.clientX - r.left) / r.width - 0.5;
          pointerY = (e.clientY - r.top) / r.height - 0.5;
        }
        function onLeave() {
          pointerX = 0;
          pointerY = 0;
        }
        host.current.addEventListener('pointermove', onPointer);
        host.current.addEventListener('pointerleave', onLeave);
        const resize = () => {
          if (!host.current) return;
          const { width, height } = host.current.getBoundingClientRect();
          if (!width || !height) return;
          const ratio = width / height;
          camera.left = -7.4 * ratio;
          camera.right = 7.4 * ratio;
          camera.top = 7.4;
          camera.bottom = -7.4;
          camera.updateProjectionMatrix();
          renderer.setSize(width, height);
        };
        const observer = new ResizeObserver(resize);
        observer.observe(host.current);
        resize();
        function animate(time) {
          frame = requestAnimationFrame(animate);
          const delta = Math.min((time - last) / 1000, 0.1);
          last = time;
          if (!pausedRef.current && !document.hidden) {
            phase += delta;
            city.position.y = Math.sin(phase * 0.7) * 0.12;
            city.rotation.y += (-0.22 + pointerX * 0.2 - city.rotation.y) * 0.035;
            city.rotation.x += (pointerY * 0.06 - city.rotation.x) * 0.03;
            pins.forEach((p, i) => (p.position.y = 1.4 + Math.sin(phase * 1.8 + i) * 0.12));
            traveler.position.copy(path.getPoint((phase * 0.075) % 1));
          }
          renderer.render(scene, camera);
        }
        frame = requestAnimationFrame(animate);
        cleanup = () => {
          cancelAnimationFrame(frame);
          observer.disconnect();
          host.current?.removeEventListener('pointermove', onPointer);
          host.current?.removeEventListener('pointerleave', onLeave);
          scene.traverse((o) => {
            o.geometry?.dispose();
            if (o.material) {
              const mats = Array.isArray(o.material) ? o.material : [o.material];
              mats.forEach((m) => m.dispose());
            }
          });
          renderer.dispose();
          renderer.domElement.remove();
        };
      })
      .catch(() => {
        if (!disposed) setFailed(true);
      });
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);
  return (
    <div className="city-stage">
      <div className="city-orbit orbit-one" />
      <div className="city-orbit orbit-two" />
      <div ref={host} className="city-canvas" />
      {failed && (
        <div className="city-fallback">
          <img src="/favicon.svg" alt="LocalRoute" />
          <span>Your next adventure starts here.</span>
        </div>
      )}
      <div className="city-chip city-chip-route">
        <span>
          <Navigation size={17} />
        </span>
        <div>
          <strong>A little more exploring</strong>
          <small>Your city. A fresh perspective.</small>
        </div>
      </div>
      <div className="city-chip city-chip-ai">
        <Sparkles size={15} />
        <strong>A local guide, in your pocket.</strong>
      </div>
      <div className="city-caption">
        <span>BUILT FOR THE WAY YOU MOVE</span>
        <button
          aria-label={paused ? 'Play city animation' : 'Pause city animation'}
          aria-pressed={paused}
          onClick={() => setPaused((p) => !p)}
        >
          {paused ? <Play size={13} /> : <Pause size={13} />}
        </button>
      </div>
    </div>
  );
}
