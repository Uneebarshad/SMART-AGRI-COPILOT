/**
 * OnboardingBackdrop — the full-bleed agricultural scene shared by the three
 * /welcome steps. Visual language intentionally mirrors the finalized Login
 * page's SceneBackdrop (day-field light / deep-green dusk dark, sun glow,
 * rolling-field silhouettes, crop-row furrows, vignette) but is an independent
 * implementation: LoginPage.jsx must stay untouched, so nothing is imported
 * from it. Pure CSS + inline SVG — no image assets, no dependencies.
 *
 * NOTE ON DARK COLOURS: the `.dark` block in index.css INVERTS the `field`
 * green scale (field-50 becomes near-black, field-950 near-white), so the dark
 * atmosphere stops here are literal hex greens, exactly as on Login.
 */
export function OnboardingBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      {/* Sky → field gradient base (warm leaf tone, not blue). */}
      <div className="absolute inset-0 bg-gradient-to-b from-leaf-50 via-field-50 to-field-200 dark:from-[#0a1a12] dark:via-[#08150f] dark:to-[#04100a]" />

      {/* Sun glow, high and slightly right of centre. */}
      <div className="absolute inset-0 bg-[radial-gradient(60%_45%_at_72%_18%,rgba(253,224,71,0.4),transparent_60%)] dark:bg-[radial-gradient(60%_45%_at_72%_20%,rgba(74,222,128,0.16),transparent_60%)]" />

      {/* Rolling field silhouettes for depth. */}
      <svg
        viewBox="0 0 1440 320"
        preserveAspectRatio="none"
        className="absolute inset-x-0 bottom-0 h-1/2 w-full"
      >
        <path
          className="fill-field-200/70 dark:fill-[#0c2418]"
          d="M0 160c220-60 420 40 660-10s520-70 780 20v150H0Z"
        />
        <path
          className="fill-field-300/80 dark:fill-[#0a1c13]"
          d="M0 210c260-50 480 30 760-15s460-45 680 5v135H0Z"
        />
        <path
          className="fill-field-400/70 dark:fill-[#07140d]"
          d="M0 260c240-40 520 20 800-10s400-25 640 0v70H0Z"
        />
      </svg>

      {/* Ploughed crop-row furrows on the foreground field, faded toward the horizon. */}
      <div className="absolute inset-x-0 bottom-0 h-2/5 bg-[repeating-linear-gradient(74deg,rgba(21,128,61,0.12)_0px,rgba(21,128,61,0.12)_2px,transparent_2px,transparent_15px)] [mask-image:linear-gradient(to_top,black,transparent)] dark:bg-[repeating-linear-gradient(74deg,rgba(74,222,128,0.07)_0px,rgba(74,222,128,0.07)_2px,transparent_2px,transparent_15px)] dark:[mask-image:linear-gradient(to_top,rgba(0,0,0,0.7),transparent)]" />

      {/* Soft centre halo so the glass sheet reads against the scene (mirrors
          Login's directional scrim, centred because onboarding is one column). */}
      <div className="absolute inset-0 bg-[radial-gradient(75%_65%_at_50%_45%,rgba(255,255,255,0.5),transparent_70%)] dark:bg-[radial-gradient(75%_65%_at_50%_45%,rgba(0,0,0,0.5),transparent_70%)]" />

      {/* Vignette for premium depth. */}
      <div className="absolute inset-0 shadow-[inset_0_0_180px_rgba(6,40,20,0.18)] dark:shadow-[inset_0_0_220px_rgba(0,0,0,0.55)]" />
    </div>
  );
}

export default OnboardingBackdrop;
