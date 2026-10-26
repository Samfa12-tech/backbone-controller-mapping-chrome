import { createCaptureSession, labels } from './session.mjs';
const element = id => document.getElementById(id);
for (const label of labels) {
  const option = document.createElement('option');
  option.value = label; option.textContent = label;
  element('label').append(option);
}
let session;
session = createCaptureSession({
  getGamepads: () => navigator.getGamepads(),
  requestFrame: callback => requestAnimationFrame(callback),
  cancelFrame: id => cancelAnimationFrame(id),
  canPoll: () => !document.hidden && document.hasFocus(),
  onSnapshot: snapshot => {
    element('values').textContent = snapshot ? JSON.stringify(snapshot, null, 2) : 'No active snapshot';
    element('record').disabled = !snapshot;
    element('status').textContent = snapshot ? 'Polling locally. Keep a labelled snapshot when ready.' :
      session?.running ? 'Waiting for controller activation. Press a controller button.' : 'Stopped. Press Start to resume.';
  }
});
const updateCount = () => {
  const count = session.export().samples.length;
  element('count').textContent = `${count} / 100 snapshots kept`;
  element('download').disabled = count === 0;
};
element('start').addEventListener('click', () => {
  if (typeof navigator.getGamepads !== 'function') {
    element('status').textContent = 'Gamepad API unavailable. Use a supported browser on localhost.'; return;
  }
  session.start();
});
element('stop').addEventListener('click', session.stop);
window.addEventListener('blur', session.stop);
window.addEventListener('pagehide', session.stop);
window.addEventListener('gamepaddisconnected', session.stop);
document.addEventListener('visibilitychange', () => { if (document.hidden) session.stop(); });
element('record').addEventListener('click', () => {
  if (!session.record(element('label').value, element('phase').value)) {
    element('status').textContent = 'No active sample, invalid label, or 100-snapshot limit reached.';
  }
  updateCount();
});
element('clear').addEventListener('click', () => { session.clear(); updateCount(); });
element('download').addEventListener('click', () => {
  if (session.export().samples.length === 0) return;
  const url = URL.createObjectURL(new Blob([JSON.stringify(session.export(), null, 2)], { type: 'application/json' }));
  const link = document.createElement('a'); link.href = url; link.download = 'backbone-samples.json';
  link.click(); setTimeout(() => URL.revokeObjectURL(url), 1000);
});
