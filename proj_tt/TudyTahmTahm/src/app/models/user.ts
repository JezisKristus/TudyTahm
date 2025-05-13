export interface User {
  userID: number;
  userName: string;
  userPassword: string;
  userEmail: string;
  userIconPath: string;
}

export interface TokenResult {
  token: string;
  user: User; // Uchovává informace o uživateli
  userID: number; // Uchovává ID uživatele
  refreshToken: string; // Uchovává refresh token
}
