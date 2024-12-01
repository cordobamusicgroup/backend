export class CurrentUserResponseDto {
  id: number;
  username: string;
  email: string;
  role: string;
  clientId: number; // Add clientId
  clientName: string; // Add clientName
}
