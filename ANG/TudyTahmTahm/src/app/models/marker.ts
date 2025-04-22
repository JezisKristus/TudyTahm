export interface Marker {
  markerId: number;
  idUser: number;
  idPoint: number;
  markerName: string;
  markerIconPath: string;
  longitude: number;
  latitude: number;
}

//je to takhle, protoze kdyz se do databaze uklada marker musi mit vzdycky i GPSPoint, v API se pak rozhodne
//jestli pouzit novej gpspoint nebo pouzit starej, kazdopadne to zatim nedelam zatim se vytvori automaticky. gragas support
