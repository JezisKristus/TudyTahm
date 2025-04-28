export interface CreateUpdateMarkerDto {
  markerID: number;
  IDUser: number;
  IDPoint?: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  latitude: number;
  longitude: number;
}
