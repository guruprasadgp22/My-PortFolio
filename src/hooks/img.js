import SIZES from "../images.json";

/*
  Responsive WebP for images in public/ (and for images uploaded in the admin page, served from /api/img/): <img {...pic("/projects/job-board.jpg", "(min-width: 1024px) 60vw, 100vw")} />
  Every JPG has a .webp copy (and a -640.webp one when it's wide), made with cwebp; images.json lists their widths.
  The browser picks the smallest file that fits the screen. If WebP can't be shown, it falls back to the JPG.
  After adding or replacing an image, regenerate them (README → "Images").
*/
export default function pic(src, sizes) {
  // uploaded in the admin page (MongoDB): the server keeps a 640px copy next to the full one
  if (src?.startsWith("/api/img/")) return { src, srcSet: `${src}?size=small 640w, ${src} 1600w`, sizes };
  const widths = SIZES[src];
  if (!widths) return { src };
  const base = src.replace(/\.jpe?g$/i, "");
  const srcSet = widths.map((w, i) => `${i === 0 ? `${base}.webp` : `${base}-${w}.webp`} ${w}w`).join(", ");
  return {
    src,
    srcSet,
    sizes,
    onError: (e) => {
      const el = e.currentTarget;
      if (el.srcset) (el.removeAttribute("srcset"), (el.src = src));
    },
  };
}
