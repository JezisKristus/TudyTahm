export interface CreateUpdateMarkerDto {
  idUser: number;
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  latitude: number;
  longitude: number;
}
