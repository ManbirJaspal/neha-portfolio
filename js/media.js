// One switch for every image on the site.
// 'remote' reads from the original Framer CDN; 'local' reads optimised copies from img/ (see tools/build-images.mjs).
const IMG_MODE = 'local';
const CDN = 'https://framerusercontent.com/images/';
export const VIDEO = IMG_MODE === 'local' ? 'img/returns-demo.mp4' : 'https://framerusercontent.com/assets/yA6xufaCqM8ovn3GxM5yrJbenkI.mp4';
export function src(id, w = 2048) {
  if (IMG_MODE === 'local') return `img/${id.replace(/\.\w+$/, '')}-${w}.webp`;
  return `${CDN}${id}?scale-down-to=${w}`;
}
export function hydrate(root = document) {
  root.querySelectorAll('img[data-img]').forEach(im => { im.src = src(im.dataset.img, +im.dataset.w || 2048); im.removeAttribute('data-img'); });
}
