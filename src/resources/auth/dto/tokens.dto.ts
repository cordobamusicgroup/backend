export class TokensDto {
  access_token: string;
  refresh_token: string;
  expires_in: number; // Access token expiration in seconds
  refresh_expires_in: number; // Refresh token expiration in seconds
}
