import listenSilentDefaultSvg from './listen-silent-default.svg?raw';
import listenPlayingDefaultSvg from './listen-playing-default.svg?raw';
import listenSilentEsSvg from './listen-silent-es.svg?raw';
import listenPlayingEsSvg from './listen-playing-es.svg?raw';

const toSvgDataUri = (svg: string): string =>
  `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;

export const LISTEN_SILENT_DEFAULT_URL = toSvgDataUri(listenSilentDefaultSvg);
export const LISTEN_PLAYING_DEFAULT_URL = toSvgDataUri(listenPlayingDefaultSvg);
export const LISTEN_SILENT_ES_URL = toSvgDataUri(listenSilentEsSvg);
export const LISTEN_PLAYING_ES_URL = toSvgDataUri(listenPlayingEsSvg);
