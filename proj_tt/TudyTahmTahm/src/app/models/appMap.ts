export interface AppMap {
  mapID: number;
  idUser: number;
  mapName: string;
  mapPreviewPath: string;
  description: string;
  permission?: 'read' | 'write' | 'owner';
  sharedWith: SharedUser[];
}

export interface SharedUser {
  userID: number;
  userName: string;
  userEmail: string;
  permission: 'read' | 'write' | 'owner';
}
