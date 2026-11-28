import { render } from 'preact';
import { registerSW } from 'virtual:pwa-register';
import { App } from './ui/App';
import { installTips } from './ui/tips';
import './styles.css';

installTips();
const root = document.getElementById('app')!;
let update: (() => void) | null = null;
let offlineReady = false;
const draw = () => render(<App update={update} offlineReady={offlineReady} />, root);
draw();

if ('serviceWorker' in navigator) {
  const activate = registerSW({
    // A new build is waiting: the home screen offers "Update now", which activates the waiting
    // worker; the page reloads once that worker takes control.
    onNeedRefresh() {
      update = () => void activate(true);
      draw();
    },
    // The whole app, card images included, is stored on this device.
    onOfflineReady() {
      offlineReady = true;
      draw();
    },
  });
}
