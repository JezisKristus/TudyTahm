export interface CreateUpdateMarkerDto {
  markerId: number;
  idUser: number;
  idPoint?: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  latitude: number;
  longitude: number;
}
