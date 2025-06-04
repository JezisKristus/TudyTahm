export interface AppMap {
  mapID: number;
  idUser: number;
  mapName: string;
  mapPreviewPath: string;
  description: string;
  sharedWith: SharedUser[];
}

export interface SharedUser {
  userId: number;
  mapId: number;
  userName: string;
  userEmail: string;
  permission: 'read' | 'write' | 'owner';
}
