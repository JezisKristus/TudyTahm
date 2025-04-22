export interface Overlay {
  overlayID: number;
  idMap: number;
  overlay: any; // Using 'any' for bitmap, consider using a proper type for handling image data
}
