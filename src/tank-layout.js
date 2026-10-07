// Render-specific geometry for the tank PNGs, in image pixels.
// Forking with a different render? Replace the PNG, then re-measure these.
export const tankLayouts = {
  plain: { // assets/tank-only.png (default)
    width: 720,
    height: 907,
    span: 0.67, // card-width fraction; sized so the tank body matches the pipe render
    labelOffsetX: 8,
    fill: { left: 36, right: 684, top: 107, bottom: 797, radius: 72 },
  },
  pipe: { // assets/tank-with-pipe.png (show_pipe: true)
    width: 1362,
    height: 1155,
    span: 1,
    labelOffsetX: 10, // optical nudge for the percentage/name text, image px
    fill: { left: 215, right: 1030, top: 170, bottom: 1030, radius: 90 },
  },
};
