import type { Store } from '../../lib/storage';
import { Panel } from './Panel';

export function App({ store }: { store?: Store }) {
  return <Panel store={store} />;
}
