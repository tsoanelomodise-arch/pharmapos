export type AdumoIntegrationMode = 'terminal' | 'online';
export type AdumoEnvironment = 'sandbox' | 'production';

export interface AdumoSettings {
  enabled: boolean;
  environment: AdumoEnvironment;
  mode: AdumoIntegrationMode;
  merchantUid: string;
  applicationUid: string;
  clientSecret: string;
  // Terminal-specific configurations (Adumo Connect / LAN / Cloud Relay)
  terminalId: string;
  terminalIp: string;
  terminalPort: string;
  terminalTimeoutSeconds: number;
  autoPrintCustomerSlip: boolean;
}

export interface AdumoTransactionRequest {
  reference: string;
  amount: number;
  currency?: string;
  customerName?: string;
  customerPhone?: string;
  notes?: string;
}

export interface AdumoTransactionResult {
  success: boolean;
  transactionId: string;
  reference: string;
  amount: number;
  authCode?: string;
  terminalId?: string;
  cardScheme?: string; // Visa, Mastercard, etc.
  maskedPan?: string;  // e.g. **** **** **** 4123
  rrn?: string;        // Retrieval Reference Number
  statusCode?: string;
  statusMessage: string;
  timestamp: string;
  receiptSlip?: {
    merchantCopy?: string;
    customerCopy?: string;
  };
}
