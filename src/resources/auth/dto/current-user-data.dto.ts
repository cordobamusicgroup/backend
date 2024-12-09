export class CurrentUserResponseDto {
  id: number;
  fullName: string;
  username: string;
  email: string;
  role: string;
  clientId: number; // Add clientId
  clientName: string; // Add clientName
}
