import { APP_VERSION, BUILD_ID } from '../version';

/** The home screen, until the board exists (milestone M3). */
export function App() {
  return (
    <main class="home">
      <h1>Travel Tabletop v3</h1>
      <p>A rules-enforcing Magic: The Gathering game for two players on one device, with the Avatar card pool.</p>
      <p class="dim">In development: the design is in the repository's docs.</p>
      <p class="version">v{APP_VERSION} · {BUILD_ID}</p>
    </main>
  );
}
