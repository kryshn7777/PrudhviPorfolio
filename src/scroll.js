// Shared between DOM and the render loop without re-rendering React every frame.
// s = target stage (from scrollbar), v = smoothed stage used for animation.
export const scroll = { s: 0, v: 0 };
