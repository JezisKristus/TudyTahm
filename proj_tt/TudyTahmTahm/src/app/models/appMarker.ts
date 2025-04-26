export interface AppMarker {
  markerId: number;
  idUser: number;
  idPoint: number;
  //idMap: number; // Pro gps-point vlastně neni důvod, musíme vyřešit jak je napojit, jestli to tahat přes 2 classy nebo přes jednu
  markerName: string;
  markerDescription: string;
  markerIconPath: string;
  // Musíme vymyslet jak bude teda fungovat marker a point, co půjde jak
  longitude: number; // Musí být platné číslo
  latitude: number;  // Musí být platné číslo
}

//je to takhle, protoze kdyz se do databaze uklada marker musi mit vzdycky i GPSPoint, v API se pak rozhodne
//jestli pouzit novej gpspoint nebo pouzit starej, kazdopadne to zatim nedelam zatim se vytvori automaticky. gragas support

// Lenka dala do tisku nejen jejich prosekty na kajaky.
// schizofrenie je když
