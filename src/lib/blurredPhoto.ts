// Pre-blurred, small copies of the city photos: the blur is baked once on a canvas and cached,
// so the full-screen background needs no CSS filter at runtime.
export const BLUR_BAKE_WIDTH = 480;
/** The old CSS blur was 30px on a ~1560px-wide image; same ratio at the baked size. */
const BLUR_PX = (30 * BLUR_BAKE_WIDTH) / 1560;

const cache = new Map<string, Promise<string>>();

function bake(src: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => {
      try {
        const w = BLUR_BAKE_WIDTH;
        const h = Math.round((img.naturalHeight / img.naturalWidth) * w);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d")!;
        const pad = BLUR_PX * 3;
        // Draw past the edges so the blur has content to sample there (no dark border).
        ctx.filter = `blur(${BLUR_PX}px)`;
        ctx.drawImage(img, -pad, -pad, w + pad * 2, h + pad * 2);
        ctx.filter = "none";
        canvas.toBlob((blob) => resolve(blob ? URL.createObjectURL(blob) : src), "image/jpeg", 0.85);
      } catch {
        resolve(src);
      }
    };
    img.onerror = () => resolve(src);
    img.src = src;
  });
}

export function getBlurredPhoto(src: string): Promise<string> {
  let p = cache.get(src);
  if (!p) {
    p = bake(src);
    cache.set(src, p);
  }
  return p;
}
