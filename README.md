# Today I Die — modern web preservation

A mobile-first, installable web version of Daniel Benmergui's **Today I Die**. The original Flash 9 game is preserved byte-for-byte and runs through the open-source Ruffle WebAssembly runtime, with no Flash plugin or native wrapper required.

## Run locally

```sh
npm install
npm run dev
```

Open the local URL on a desktop browser or another device on the same network. Touch the screen once to unlock audio and request fullscreen.

## Production build

```sh
npm run build
npm run preview
```

Deploy the contents of `dist/` to any static HTTPS host. HTTPS is required for service workers and installable PWA behavior outside localhost.

On iPhone or iPad, use Safari's **Share → Add to Home Screen** for the closest match to the original app: portrait orientation, no browser toolbar, and offline play.

The launch dialog offers all seven original translations. A direct `?lang=en`, `sp`, `pt`, `de`, `it`, `cz`, or `fr` URL highlights that language in the dialog.

## Preservation notes

- Original stage: 390 × 570 at 30 fps
- Original runtime: Flash 9 / ActionScript 3
- Browser-targeted source recovered from the archived official web release
- The archive contains one shared SWF; it switches translations by reading `loaderInfo.parameters.lang`
- Verified archive capture: `20170506014859`, SHA-256 `f885a7db9720bb63b475b17d637d7e894a9f1a5b6389053187eea9051d735a60`
- The Windows projector was also inspected; its embedded SWF uses an EXE-specific checksum and is retained only as a provenance reference
- Game viewport uses aspect-fit scaling and never crops the original composition
- Ruffle renders into a fixed 390 × 570, 1× drawing buffer; CSS scales the completed frame to the device viewport
- This preserves the original iPhone rendering behavior: English words come from bitmap sprite sheets created for the 390 × 570 stage, while translations use dynamic Flash text fields. Rasterizing the entire SWF at the original stage resolution before scaling keeps both kinds of text visually consistent instead of rendering translations at the device's sharper native resolution.
- The shell blocks page scrolling, selection, pinch zoom, and touch callouts

## Credits

- Game by Daniel Benmergui
- Music by Hernan Rozenwasser
- Originally funded by Jonathan Blow
- Flash playback preservation powered by Ruffle (MIT or Apache-2.0; licenses are shipped with the runtime)
