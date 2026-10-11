/** How to reach the dev, shown after a good pitch (F-043): only what the owner chose to share. */
export interface Contact {
  /** Full profile URL. */
  linkedin?: string;
  email?: string;
  /** Path of the CV PDF served from `public/`, e.g. `/cv.pdf`. */
  cvPdf?: string;
}
