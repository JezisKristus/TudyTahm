export interface AppMarker {
  markerID: number;
  idMap: number; // Sending IDMap to API, I don't work with gpsPoint at all
  idLabel: number;
  markerName: string;
  markerDescription: string;
  longitude: number; // Musí být platné číslo
  latitude: number;  // Musí být platné číslo
}



