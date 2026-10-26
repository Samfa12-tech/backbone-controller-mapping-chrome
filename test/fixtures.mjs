// Synthetic snapshots reconstructed from the sanitized reference, not raw sessions.
export const environment = { os: 'Windows', browser: 'Chrome', transport: 'USB' };
export const neutralAxes = [0, 0, 0, -1, -1, 0, 0, 0, 0, 1.2857143878936768];
export const buttonMap = {
  south: 0, east: 1, west: 3, north: 4, leftShoulder: 6, rightShoulder: 7,
  leftTriggerDigital: 8, rightTriggerDigital: 9, threeDots: 10, menu: 11,
  launcher: 12, leftStick: 13, rightStick: 14
};
export const hats = [
  [-1, [0, -1]], [-0.7142857, [1, -1]], [-0.4285714, [1, 0]],
  [-0.1428571, [1, 1]], [0.1428572, [0, 1]], [0.4285715, [-1, 1]],
  [0.7142857, [-1, 0]], [1, [-1, -1]]
];
export function pad(changes = {}) {
  return { id: 'Backbone One (Vendor: 358a Product: 0204)', mapping: '', connected: true,
    axes: [...neutralAxes], buttons: Array.from({ length: 17 }, () => ({ pressed: false, value: 0 })),
    ...changes };
}
