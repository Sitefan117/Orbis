/** Sur tablette, le pavé intégré remplace le clavier virtuel du système. */
export function usesTouchKeypad(): boolean {
  return window.matchMedia('(pointer: coarse)').matches || navigator.maxTouchPoints > 1;
}
