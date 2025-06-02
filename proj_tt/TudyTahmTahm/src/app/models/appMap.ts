export interface AppMap {
  mapID: number;
  idUser: number;
  isCustom: boolean;
  mapName: string;
  mapPath: string;
  mapPreviewPath: string;
  description: string;
  sharedWith: SharedUser[];
}

export interface SharedUser {
  userId: number;
  mapId: number;
  userName: string;
  permission: 'read' | 'write' | 'owner';
}
