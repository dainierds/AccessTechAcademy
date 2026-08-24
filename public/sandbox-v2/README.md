# 🚪 AccessLab Pro - Simulador de Control de Acceso & Biblioteca Vectorial HD

Simulador interactivo de control de acceso, seguridad electrónica y cableado industrial en tiempo real con una biblioteca de 13 componentes vectoriales SVG ultrarealistas con puntos de conexión en bornes físicos reales.

---

## 🌟 Características Principales

- **Simulador Interactivo de Puerta**: Banco de trabajo con física interactiva, estados de bloqueo/desbloqueo, alarmas de puerta abierta forzada (DOTL), sensores PIR y cableado dinámico.
- **Biblioteca Vectorial HD (13 Equipos On-Board)**:
  1. **Controladora HID Aero X100**: Módulo de 2 lectoras, 4 relés Omron, 4 entradas supervisadas y 56 bornes de tornillo.
  2. **Switch PoE Gigabit Industrial**: 5 puertos RJ45 8P8C modulares, slot SFP de fibra, switch VLAN y protección 4KV.
  3. **Cable 18/2 AWG Profesional**: Conductores Rojo (+) y Negro (-) saliendo de ambas puntas, chaqueta PVC serigrafiada y cobre desnudo multifilar.
  4. **Multímetro Digital Pro (DMM-9000)**: Selector de 3 posiciones (V= DC, V~ AC, •))) Continuidad), LCD retroiluminado y sondas con diana de contacto.
  5. **Relé Camden CX-12 PLUS**: 16 bornes Euroblock, 2 relés Form-C, 3 trimmers analógicos (DOR/DOO) y DIP switch x3.
  6. **Lectora RFID HID con Teclado**: 6 cables Wiegand (Rojo, Negro, Blanco, Verde, Azul, Marrón) y barra de luz superior red/green.
  7. **Contacto Magnético Empotrable (DPS Enforcer)**: 2 cables (+ / -) con animación de unión 100% cara a cara (0.0mm gap).
  8. **Fuente de Poder Altronix AL400ULXB2 & ACM8**: 40+ bornes on-board con 8 entradas de disparo y 8 salidas Form-C supervisadas.
  9. **Pulsador Push to Exit (REX)**: 5 bornes Form-C, placa de acero inoxidable 304 y botón verde retroiluminado.
  10. **Crashbar Electrificada (Von Duprin 75/99)**: 2 bornes de retracción eléctrica motorizada de pestillo (QEL).
  11. **Electroimán 600 LBS (Maglock Fail-Safe)**: 2 bornes (+ / -), núcleo de acero y armadura en aluminio cepillado.
  12. **Door Controller (NTX700-CTLR)**: Controladora multilínea con 4 relés, doble interfaz Wiegand y bus TCP/IP.
  13. **Door Position Sensor PIR (DPS-800-REX)**: Detector PIR con lente Fresnel, 12 bornes y DIP switch x10.
- **Visores Standalone**: Cada componente incluye su propio banco de pruebas interactivo (`*_preview.html`) con cableado digital, selector de colores, copia rápida de código SVG y simulación de estados.

---

## 🚀 Cómo Ejecutar en Local

Puedes correr el proyecto con cualquier servidor web estático local:

### Con Python:
```bash
python -m http.server 3000
```
Luego abre en tu navegador: [http://localhost:3000](http://localhost:3000)

### Con Node / npx:
```bash
npx serve .
```

---

## 🌐 Publicar en GitHub Pages

1. Sube el repositorio a GitHub.
2. Ve a **Settings > Pages** en tu repositorio de GitHub.
3. En **Branch**, selecciona `main` y la carpeta `/ (root)`.
4. Haz clic en **Save** y tu simulador estará disponible públicamente en la web en pocos segundos.

---

## 📄 Licencia

MIT License - Desarrollado para entrenamiento, ingeniería y simulación de sistemas de seguridad electrónica y control de acceso.
