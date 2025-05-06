export interface CreateUpdateMarkerDto {
  markerID: number;
  IDMap: number;
  IDLabel: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  latitude: number;
  longitude: number;
}
