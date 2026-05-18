export interface SystemLog {
  id?: number;
  userId?: number;
  userName?: string;
  ipAddress: string;
  action: string;
  descripcion?: string;
  loginTime?: Date;
  logoutTime?: Date;
  twoFAUsed: boolean;
  timestamp: Date;
}
