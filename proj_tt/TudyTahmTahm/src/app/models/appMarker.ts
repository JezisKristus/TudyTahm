export interface AppMarker {
  markerID: number;
  IDUser: number; // Is not really needed, might refactor to not use GPSPoint at all and move here
  IDPoint: number;
  IDMap: number; // Sending IDMap to API, I don't work with gpsPoint at all
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  longitude: number; // Musí být platné číslo
  latitude: number;  // Musí být platné číslo
}



