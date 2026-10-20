// Shared between DOM and the render loop without re-rendering React every frame.
// s = target stage (from scrollbar), m = first damping stage, v = final smoothed stage used for animation.
export const scroll = { s: 0, m: 0, v: 0 };
