declare module 'speakeasy' {
  export interface GeneratedSecret {
    ascii: string;
    hex: string;
    base32: string;
    otpauth_url?: string;
  }

  export interface GenerateSecretOptions {
    name?: string;
    issuer?: string;
    length?: number;
  }

  export interface TOTPOptions {
    secret: string;
    encoding?: string;
    time?: number;
    step?: number;
    window?: number;
  }

  export interface TOTPVerifyOptions extends TOTPOptions {
    token: string;
  }

  export interface TOTPVerifyResult {
    delta?: number;
  }

  export function generateSecret(options?: GenerateSecretOptions): GeneratedSecret;
  export function totp(options: TOTPOptions): string;
  export function totp_verify(options: TOTPVerifyOptions): TOTPVerifyResult | boolean;
  
  export namespace totp {
    function verify(options: TOTPVerifyOptions): TOTPVerifyResult | boolean;
  }
}

declare module 'qrcode' {
  export interface QRCodeToDataURLOptions {
    type?: 'image/png' | 'image/jpeg' | 'image/webp';
    quality?: number;
    margin?: number;
    color?: {
      dark?: string;
      light?: string;
    };
    width?: number;
  }

  export function toDataURL(text: string, options?: QRCodeToDataURLOptions): Promise<string>;
  export function toString(text: string, options?: any): Promise<string>;
}
