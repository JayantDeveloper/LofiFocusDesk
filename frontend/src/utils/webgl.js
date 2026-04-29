export function checkWebGLSupport() {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    const ctx =
      canvas.getContext("webgl2") ||
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl");
    if (!ctx) return false;
    // A context can be created but immediately lost when the GPU is sandboxed/disabled.
    if (ctx.isContextLost()) return false;
    // Verify the context can actually execute a GL call.
    const ext = ctx.getSupportedExtensions();
    return Array.isArray(ext);
  } catch {
    return false;
  }
}
