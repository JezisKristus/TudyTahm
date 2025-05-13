export interface AppMarker {
  markerID: number;
  IDPoint: number;
  IDMap: number; // Sending IDMap to API, I don't work with gpsPoint at all
  IDLabel: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  longitude: number; // Musí být platné číslo
  latitude: number;  // Musí být platné číslo
}



