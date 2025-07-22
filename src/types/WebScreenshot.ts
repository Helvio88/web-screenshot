export default interface WebScreenshot {
  url: string;
  time: number;
  x: number;
  y: number;
  width: number;
  height: number;
  path: string;
  tmp: string;
  ext: 'jpeg' | 'png' | 'webp';
  crop: boolean;
  auth?: string;
}