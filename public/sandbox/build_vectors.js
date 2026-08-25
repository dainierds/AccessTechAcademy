const fs = require('fs');

const items = [
  { key: 'digital-multimeter', file: 'digital_multimeter.svg' },
  { key: 'camden-relay', file: 'camden_relay.svg' },
  { key: 'hid-aero-x100', file: 'hid_aero_x100.svg' },
  { key: 'poe-switch', file: 'poe_switch.svg' },
  { key: 'altronix-power-supply', file: 'altronix_power_supply.svg' },
  { key: 'altronix-al175', file: 'altronix_al175_v2.svg', altPath: 'public/svgs/altronix_al175_v2.svg' },
  { key: 'maglock', file: 'maglock.svg' },
  { key: 'crashbar', file: 'crashbar.svg' },
  { key: 'push-to-exit', file: 'pushtoexit.svg' },
  { key: 'prox-reader', file: 'rfid_reader.svg' },
  { key: 'door-position', file: 'magnetic_door_sensor.svg' },
  { key: 'door-controller', file: 'door_controller.svg' }
];

const bundle = {};
items.forEach(it => {
  const p = it.altPath || ('public/sandbox-v2/' + it.file);
  if(fs.existsSync(p)){
    bundle[it.key] = fs.readFileSync(p, 'utf8');
  } else if (fs.existsSync('public/sandbox-v2/' + it.file)) {
    bundle[it.key] = fs.readFileSync('public/sandbox-v2/' + it.file, 'utf8');
  }
});

const fileContent = `/* Native Vector Library - Sandbox V2 to Sandbox V1 */
window.NATIVE_VECTOR_SVGS = ${JSON.stringify(bundle)};
window._nativeSvgImages = {};

(function initNativeSvgImages() {
  if (typeof window !== 'undefined' && window.NATIVE_VECTOR_SVGS) {
    for (const [key, svg] of Object.entries(window.NATIVE_VECTOR_SVGS)) {
      try {
        const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
        const img = new Image();
        img.onload = () => {
          if (window.editor && typeof window.editor.render === 'function') window.editor.render();
          if (typeof renderPalette === 'function') renderPalette();
          if (typeof renderLibrary === 'function') renderLibrary();
        };
        img.src = URL.createObjectURL(blob);
        window._nativeSvgImages[key] = img;
      } catch (e) {
        console.error('Error initting native vector image', key, e);
      }
    }
  }
})();

function drawNativeVector(ctx, key, w, h, fallbackFn) {
  const img = window._nativeSvgImages[key];
  if (img && img.complete && img.naturalWidth > 0) {
    ctx.drawImage(img, 0, 0, w, h);
  } else if (fallbackFn) {
    fallbackFn(ctx);
  } else {
    ctx.fillStyle = '#ffffff';
    if (typeof rrect === 'function') rrect(ctx, 0, 0, w, h, 8); else ctx.fillRect(0, 0, w, h);
    ctx.fill();
  }
}
`;

fs.writeFileSync('public/sandbox/native_vectors.js', fileContent);
console.log('Successfully written native_vectors.js with', Object.keys(bundle).length, 'vectors');
