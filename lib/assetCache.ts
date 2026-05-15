// Module-level blob URL caches — populated at startup, persist for the session.
// Scene components read from here to guarantee zero-decode-delay rendering.
export const imageBlobUrls = new Map<string, string>()
export const videoBlobUrls = new Map<string, string>()
