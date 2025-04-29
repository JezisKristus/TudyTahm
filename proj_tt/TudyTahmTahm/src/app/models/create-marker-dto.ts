export interface CreateUpdateMarkerDto {
  markerID: number;
  IDUser: number;
  IDPoint?: number;
  IDMap?: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  latitude: number;
  longitude: number;
}
