export type LogoQualityInput = {
  width: number | null;
  height: number | null;
  mimeType: string;
  fileSize: number;
  hasAlpha: boolean;
  isSvg: boolean;
};

export type LogoQualityResult = {
  score: number;
  warnings: string[];
  renderBlocked: boolean;
  aspectRatio: number | null;
};

export const LOGO_RENDER_SCORE_THRESHOLD = 60;

export function scoreLogoQuality(input: LogoQualityInput): LogoQualityResult {
  const warnings: string[] = [];
  let score = 100;
  const aspectRatio = input.width && input.height ? input.width / input.height : null;

  if (!input.isSvg && (!input.width || !input.height)) {
    score -= 35;
    warnings.push("Could not read raster dimensions.");
  }

  if (input.width && input.height && Math.min(input.width, input.height) < 256) {
    score -= 25;
    warnings.push("Logo is below 256px on one side.");
  }

  if (aspectRatio !== null && (aspectRatio < 0.2 || aspectRatio > 5)) {
    score -= 20;
    warnings.push("Logo aspect ratio is extreme for automatic mockup placement.");
  }

  if (!input.hasAlpha && !input.isSvg) {
    score -= 20;
    warnings.push("Raster logo has no detected transparency; background removal may be needed.");
  }

  if (input.fileSize < 2048) {
    score -= 10;
    warnings.push("File is very small; logo may be low detail.");
  }

  if (!["image/png", "image/jpeg", "image/svg+xml"].includes(input.mimeType)) {
    score -= 30;
    warnings.push("Unsupported logo MIME type.");
  }

  const boundedScore = Math.max(0, Math.min(100, score));

  return {
    score: boundedScore,
    warnings,
    renderBlocked: boundedScore < LOGO_RENDER_SCORE_THRESHOLD,
    aspectRatio,
  };
}
