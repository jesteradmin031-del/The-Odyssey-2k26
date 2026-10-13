import { useEffect, useRef } from "react";
import type * as T from "three";

/** Decorative, locally generated evidence sculpture; never verification data. */
export function HeroScene({ variant = "hero" }: { variant?: "hero" | "cta" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    const el = ref.current;
    if (!el) return;
    (async () => {
      const THREE = await import("three");
      if (disposed) return;
      const mobile = el.clientWidth < 768;
      const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
      const colors = new Map<string, T.Color>();
      const color = (token: string) => {
        const cached = colors.get(token);
        if (cached) return cached;
        const probe = document.createElement("span");
        probe.style.color = getComputedStyle(el).getPropertyValue(token);
        el.appendChild(probe);
        const resolved = getComputedStyle(probe).color;
        probe.remove();
        const ctx = document.createElement("canvas").getContext("2d");
        if (!ctx) return new THREE.Color();
        ctx.fillStyle = resolved;
        ctx.fillRect(0, 0, 1, 1);
        const [r = 0, g = 0, b = 0] = ctx.getImageData(0, 0, 1, 1).data;
        const result = new THREE.Color().setRGB(r / 255, g / 255, b / 255, THREE.SRGBColorSpace);
        colors.set(token, result);
        return result;
      };
      const cyan = color("--scene-cyan");
      const blue = color("--scene-blue");
      const silver = color("--scene-silver");
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.25 : 1.5));
      renderer.setSize(el.clientWidth, el.clientHeight);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      el.appendChild(renderer.domElement);
      el.dataset['scene'] = "ready";
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(38, el.clientWidth / el.clientHeight, .1, 60);
      camera.position.set(0, 0, 13);
      const geometries: T.BufferGeometry[] = [];
      const materials: T.Material[] = [];
      const geometry = <G extends T.BufferGeometry>(g: G) => { geometries.push(g); return g; };
      const material = <M extends T.Material>(m: M) => { materials.push(m); return m; };

      // Local studio reflections: no network textures or HDR dependencies.
      const studio = new THREE.Scene();
      const softbox = geometry(new THREE.PlaneGeometry(12, 5));
      const bright = material(new THREE.MeshBasicMaterial({ color: silver, side: THREE.DoubleSide }));
      [[0, 5, 0], [-5, 1, 2], [4, -2, 3]].forEach(([x, y, z]) => {
        const panel = new THREE.Mesh(softbox, bright);
        panel.position.set(x ?? 0, y ?? 0, z ?? 0);
        panel.lookAt(0, 0, 0);
        studio.add(panel);
      });
      const pmrem = new THREE.PMREMGenerator(renderer);
      const environment = pmrem.fromScene(studio, .08, .1, 30);
      scene.environment = environment.texture;
      pmrem.dispose();
      scene.add(new THREE.AmbientLight(silver, .8));
      const key = new THREE.DirectionalLight(silver, 3);
      key.position.set(-3, 5, 5);
      scene.add(key);
      const rim = new THREE.PointLight(cyan, 45, 18);
      rim.position.set(3, 2, 4);
      scene.add(rim);

      const sculpture = new THREE.Group();
      sculpture.position.set(variant === "hero" && !mobile ? 3.3 : 0, mobile ? 1.7 : .55, 0);
      sculpture.scale.setScalar(mobile ? .57 : variant === "cta" ? .8 : 1);
      scene.add(sculpture);
      const nucleus = new THREE.Mesh(
        geometry(new THREE.IcosahedronGeometry(.45, 0)),
        material(new THREE.MeshStandardMaterial({ color: blue, flatShading: true, emissive: blue, emissiveIntensity: 1.1 })),
      );
      sculpture.add(nucleus);
      const shell = new THREE.LineSegments(
        geometry(new THREE.WireframeGeometry(new THREE.IcosahedronGeometry(1.75, 1))),
        material(new THREE.LineBasicMaterial({ color: cyan, transparent: true, opacity: .28 })),
      );
      sculpture.add(shell);
      const innerRing = new THREE.Mesh(
        geometry(new THREE.TorusGeometry(.94, .018, 8, 100)),
        material(new THREE.MeshBasicMaterial({ color: cyan })),
      );
      innerRing.rotation.set(.35, -.45, -.4);
      sculpture.add(innerRing);
      const orbits: T.Group[] = [];
      for (let i = 0; i < 3; i++) {
        const group = new THREE.Group();
        group.rotation.set(.65 + i * .6, i * .55, -.35 + i * .7);
        const radius = 2.25 + i * .43;
        const arc = new THREE.Mesh(
          geometry(new THREE.TorusGeometry(radius, .009, 5, 120, Math.PI * 1.65)),
          material(new THREE.MeshBasicMaterial({ color: i === 1 ? silver : cyan, transparent: true, opacity: .55 })),
        );
        group.add(arc);
        const marker = new THREE.Mesh(geometry(new THREE.SphereGeometry(.055, 12, 8)), material(new THREE.MeshBasicMaterial({ color: cyan })));
        marker.position.set(radius, 0, 0);
        group.add(marker);
        sculpture.add(group);
        orbits.push(group);
      }
      // Small spherical evidence nodes preserve the claim → source structure.
      const nodes: T.Vector3[] = [];
      const nodeGeometry = geometry(new THREE.SphereGeometry(.045, 10, 8));
      const nodeMaterial = material(new THREE.MeshBasicMaterial({ color: silver }));
      const edges: number[] = [];
      for (let i = 0; i < 20; i++) {
        const phi = Math.acos(1 - 2 * (i + .5) / 20);
        const theta = i * Math.PI * (1 + Math.sqrt(5));
        const p = new THREE.Vector3(1.75 * Math.sin(phi) * Math.cos(theta), 1.75 * Math.sin(phi) * Math.sin(theta), 1.75 * Math.cos(phi));
        nodes.push(p);
        const node = new THREE.Mesh(nodeGeometry, nodeMaterial);
        node.position.copy(p);
        sculpture.add(node);
        if (i % 3 === 0) edges.push(0, 0, 0, p.x, p.y, p.z);
      }
      sculpture.add(new THREE.LineSegments(
        geometry(new THREE.BufferGeometry().setAttribute("position", new THREE.Float32BufferAttribute(edges, 3))),
        material(new THREE.LineBasicMaterial({ color: blue, transparent: true, opacity: .25 })),
      ));

      const mouse = new THREE.Vector2();
      const onMove = (e: PointerEvent) => {
        if (motion.matches) return;
        const rect = el.getBoundingClientRect();
        mouse.set((e.clientX - rect.left) / rect.width - .5, (e.clientY - rect.top) / rect.height - .5);
      };
      const resize = new ResizeObserver(() => {
        if (!el.clientWidth || !el.clientHeight) return;
        camera.aspect = el.clientWidth / el.clientHeight; camera.updateProjectionMatrix();
        renderer.setSize(el.clientWidth, el.clientHeight);
        render();
      });
      let visible = true;
      let raf = 0;
      let previous = 0;
      let elapsed = 0;
      const render = () => { camera.lookAt(mobile ? 0 : sculpture.position.x * .5, 0, 0); renderer.render(scene, camera); };
      const tick = (now: number) => {
        raf = 0;
        if (disposed || !visible || document.hidden) return;
        const delta = Math.min(previous ? (now - previous) / 1000 : 0, .05);
        previous = now;
        if (!motion.matches) {
          elapsed += delta;
          shell.rotation.y = elapsed * .07;
          shell.rotation.x = elapsed * .025;
          orbits.forEach((orbit, i) => { orbit.rotation.z += delta * .06 * (i % 2 ? -1 : 1); });
          sculpture.rotation.y += (mouse.x * .25 - sculpture.rotation.y) * (1 - Math.exp(-3 * delta));
          sculpture.rotation.x += (mouse.y * .14 - sculpture.rotation.x) * (1 - Math.exp(-3 * delta));
          camera.position.x += (mouse.x * .5 - camera.position.x) * (1 - Math.exp(-2 * delta));
          camera.position.y += (-mouse.y * .35 - camera.position.y) * (1 - Math.exp(-2 * delta));
        }
        render();
        if (!motion.matches) raf = requestAnimationFrame(tick);
      };
      const resume = () => { cancelAnimationFrame(raf); previous = 0; if (visible && !document.hidden) raf = requestAnimationFrame(tick); };
      const observer = new IntersectionObserver(([entry]) => { visible = Boolean(entry?.isIntersecting); resume(); });
      observer.observe(el); resize.observe(el);
      window.addEventListener("pointermove", onMove, { passive: true });
      document.addEventListener("visibilitychange", resume);
      motion.addEventListener("change", resume);
      render(); resume();
      cleanup = () => {
        cancelAnimationFrame(raf); observer.disconnect(); resize.disconnect();
        window.removeEventListener("pointermove", onMove);
        document.removeEventListener("visibilitychange", resume);
        motion.removeEventListener("change", resume);
        geometries.forEach(g => g.dispose()); materials.forEach(m => m.dispose());
        environment.dispose(); renderer.dispose(); renderer.domElement.remove();
      };
    })().catch(() => { if (!disposed) el.dataset['scene'] = "fallback"; });
    return () => { disposed = true; cleanup(); };
  }, [variant]);

  return <div ref={ref} className="hero-scene absolute inset-0 pointer-events-none" aria-hidden="true"><div className="scene-fallback"><i /><i /><i /></div></div>;
}
