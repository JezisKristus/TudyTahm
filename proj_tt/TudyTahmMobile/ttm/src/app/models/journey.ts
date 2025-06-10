export interface Journey {
  journeyID: number;
  idMap: number;
  name: string;
  description: string;
  map: {
    mapID: number;
    idUser: number;
    mapName: string;
    mapPreviewPath: string;
    mapDescription: string;
  };
}