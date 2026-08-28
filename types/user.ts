export interface User {
  id: string;
  employee_id?: string;
  employee_number?: number;
  username?: string;
  full_name: string;
  email: string;
  phone: string | null;
  role: string;
  status: string;
}