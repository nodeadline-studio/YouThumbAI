declare module 'color-thief-browser' {
  export default class ColorThief {
    getColor(img: HTMLImageElement | HTMLCanvasElement): number[];
    getPalette(img: HTMLImageElement | HTMLCanvasElement, colorCount?: number): number[][];
  }
} 