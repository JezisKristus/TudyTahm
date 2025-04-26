export interface CreateUpdateMarkerDto {
  idUser: number;
  idPoint?: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  latitude: number;
  longitude: number;
}
