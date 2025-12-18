"use client"

import { useEffect, useRef } from "react"
import * as THREE from "three"

export function ShaderAnimation() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<{
    camera: THREE.Camera
    scene: THREE.Scene
    renderer: THREE.WebGLRenderer
    uniforms: any
    animationId: number
  } | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    const container = containerRef.current

    const vertexShader = `
      void main() {
        gl_Position = vec4( position, 1.0 );
      }
    `

    const fragmentShader = `
      #define TWO_PI 6.2831853072
      #define PI 3.14159265359

      precision highp float;
      uniform vec2 resolution;
      uniform float time;

      // Noise function for organic movement
      float hash(vec2 p) {
        return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
      }

      float noise(vec2 p) {
        vec2 i = floor(p);
        vec2 f = fract(p);
        f = f * f * (3.0 - 2.0 * f);
        
        float a = hash(i);
        float b = hash(i + vec2(1.0, 0.0));
        float c = hash(i + vec2(0.0, 1.0));
        float d = hash(i + vec2(1.0, 1.0));
        
        return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
      }

      float fbm(vec2 p) {
        float value = 0.0;
        float amplitude = 0.5;
        for(int i = 0; i < 5; i++) {
          value += amplitude * noise(p);
          p *= 2.0;
          amplitude *= 0.5;
        }
        return value;
      }

      void main(void) {
        vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);
        float t = time * 0.15; // Faster animation
        
        // Multiple flowing layers
        vec3 color = vec3(0.0);
        
        // Layer 1: Flowing waves
        for(int i = 0; i < 4; i++) {
          float fi = float(i);
          vec2 p = uv * (1.5 + fi * 0.5);
          p.x += sin(t + fi * 0.5) * 0.3;
          p.y += cos(t * 0.8 + fi * 0.3) * 0.3;
          
          float n = fbm(p + t * 0.5);
          float wave = sin(p.x * 3.0 + t * 2.0 + n * 4.0) * 0.5 + 0.5;
          wave *= sin(p.y * 2.0 - t * 1.5 + n * 3.0) * 0.5 + 0.5;
          
          color.r += wave * 0.15 / (1.0 + fi * 0.3);
          color.g += wave * 0.12 / (1.0 + fi * 0.3);
          color.b += wave * 0.2 / (1.0 + fi * 0.3);
        }
        
        // Layer 2: Pulsing circles
        for(int j = 0; j < 5; j++) {
          float fj = float(j);
          float pulse = sin(t * 3.0 - fj * 0.8) * 0.5 + 0.5;
          float ring = abs(length(uv + vec2(sin(t + fj), cos(t * 0.7 + fj)) * 0.5) - (0.3 + fj * 0.15 + pulse * 0.1));
          float glow = 0.02 / (ring + 0.01);
          
          color.r += glow * 0.3 * pulse;
          color.g += glow * 0.4 * (1.0 - pulse);
          color.b += glow * 0.5;
        }
        
        // Layer 3: Animated grid lines
        vec2 gridUV = uv * 5.0;
        gridUV.x += sin(t * 2.0 + uv.y * 3.0) * 0.5;
        gridUV.y += cos(t * 1.5 + uv.x * 2.0) * 0.5;
        
        float gridX = abs(sin(gridUV.x * PI));
        float gridY = abs(sin(gridUV.y * PI));
        float grid = pow(gridX * gridY, 8.0);
        
        color += vec3(0.1, 0.15, 0.25) * grid * (sin(t * 4.0) * 0.3 + 0.7);
        
        // Layer 4: Floating particles
        for(int k = 0; k < 8; k++) {
          float fk = float(k);
          vec2 particlePos = vec2(
            sin(t * 0.5 + fk * 1.3) * 0.8,
            cos(t * 0.7 + fk * 1.1) * 0.8
          );
          float particle = 0.015 / (length(uv - particlePos) + 0.01);
          float flicker = sin(t * 10.0 + fk * 5.0) * 0.3 + 0.7;
          
          color += vec3(0.2, 0.3, 0.5) * particle * flicker;
        }
        
        // Add subtle vignette
        float vignette = 1.0 - length(uv) * 0.4;
        color *= vignette;
        
        // Enhance contrast
        color = pow(color, vec3(0.9));
        
        gl_FragColor = vec4(color, 1.0);
      }
    `

    const camera = new THREE.Camera()
    camera.position.z = 1

    const scene = new THREE.Scene()
    const geometry = new THREE.PlaneGeometry(2, 2)

    const uniforms = {
      time: { type: "f", value: 1.0 },
      resolution: { type: "v2", value: new THREE.Vector2() },
    }

    const material = new THREE.ShaderMaterial({
      uniforms: uniforms,
      vertexShader: vertexShader,
      fragmentShader: fragmentShader,
    })

    const mesh = new THREE.Mesh(geometry, material)
    scene.add(mesh)

    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setPixelRatio(window.devicePixelRatio)

    container.appendChild(renderer.domElement)

    const onWindowResize = () => {
      const width = container.clientWidth
      const height = container.clientHeight
      renderer.setSize(width, height)
      uniforms.resolution.value.x = renderer.domElement.width
      uniforms.resolution.value.y = renderer.domElement.height
    }

    onWindowResize()
    window.addEventListener("resize", onWindowResize, false)

    const animate = () => {
      const animationId = requestAnimationFrame(animate)
      uniforms.time.value += 0.03 // Faster time increment
      renderer.render(scene, camera)

      if (sceneRef.current) {
        sceneRef.current.animationId = animationId
      }
    }

    sceneRef.current = {
      camera,
      scene,
      renderer,
      uniforms,
      animationId: 0,
    }

    animate()

    return () => {
      window.removeEventListener("resize", onWindowResize)

      if (sceneRef.current) {
        cancelAnimationFrame(sceneRef.current.animationId)

        if (container && sceneRef.current.renderer.domElement) {
          container.removeChild(sceneRef.current.renderer.domElement)
        }

        sceneRef.current.renderer.dispose()
        geometry.dispose()
        material.dispose()
      }
    }
  }, [])

  return (
    <div
      ref={containerRef}
      className="w-full h-screen"
      style={{
        background: "#000",
        overflow: "hidden",
      }}
    />
  )
}
