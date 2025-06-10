import { Marker } from 'leaflet';
import { AppMarker } from './appMarker';

export interface ExtendedMarker extends Marker {
  selected: boolean;
  markerData: AppMarker;
  markerID: number;
}
