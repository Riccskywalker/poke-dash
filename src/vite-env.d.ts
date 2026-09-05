/// <reference types="vite/client" />
interface RareBitTestHook { snapshot: () => unknown; setDistance: (distance: number) => void; press: () => void; release: () => void; }
interface Window { __RAREBIT_TEST__?: RareBitTestHook; webkitAudioContext?: typeof AudioContext; }
