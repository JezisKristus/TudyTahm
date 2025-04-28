declare module 'leaflet-search' {
  import * as L from 'leaflet';

  export interface ControlSearchOptions extends L.ControlOptions {
    layer: L.LayerGroup;
    initial?: boolean;
    zoom?: number;
    marker?: boolean;
    propertyName?: string;
  }

  export class ControlSearch extends L.Control {
    constructor(options: ControlSearchOptions);
  }
}
