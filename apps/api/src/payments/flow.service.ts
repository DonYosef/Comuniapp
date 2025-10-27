import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { createHmac } from 'crypto';
import { firstValueFrom } from 'rxjs';

export interface FlowCreateOrderParams {
  commerceOrder: string;
  subject: string;
  amount: number;
  email: string;
  optionalData?: Record<string, any>;
}

export interface FlowCreateOrderResponse {
  url: string;
  token: string;
  flowOrder: string;
  checkoutUrl: string;
}

export interface FlowOrderStatus {
  flowOrder: string;
  commerceOrder: string;
  requestDate: string;
  status: number; // 1=pending, 2=paid, 3=rejected, 4=cancelled
  subject: string;
  currency: string;
  amount: number;
  payer: string;
  optional?: string;
  pending_info?: {
    media: string;
    date: string;
  };
  paymentData?: {
    date: string;
    media: string;
    conversionDate: string;
    conversionRate: number;
    amount: number;
    currency: string;
    fee: number;
    balance: number;
    transferDate: string;
  };
}

@Injectable()
export class FlowService {
  private readonly logger = new Logger(FlowService.name);
  private readonly flowApiUrl: string;
  private readonly flowApiKey: string;
  private readonly flowSecretKey: string;
  private readonly urlConfirmation: string;
  private readonly urlReturn: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.flowApiUrl = this.configService.get<string>('FLOW_API_URL') || '';
    this.flowApiKey = this.configService.get<string>('FLOW_API_KEY') || '';
    this.flowSecretKey = this.configService.get<string>('FLOW_SECRET_KEY') || '';
    this.urlConfirmation = this.configService.get<string>('FLOW_URL_CONFIRMATION') || '';
    this.urlReturn = this.configService.get<string>('FLOW_URL_RETURN') || '';

    if (
      !this.flowApiUrl ||
      !this.flowApiKey ||
      !this.flowSecretKey ||
      !this.urlConfirmation ||
      !this.urlReturn
    ) {
      this.logger.error('⚠️ Flow configuration incomplete. Check environment variables.');
    }
  }

  /**
   * Genera la firma HMAC-SHA256 para los parámetros ordenados alfabéticamente
   */
  private generateSignature(params: Record<string, any>): string {
    // Ordenar claves alfabéticamente
    const sortedKeys = Object.keys(params).sort();

    // Concatenar "clave + valor" sin espacios ni separadores
    const concatenated = sortedKeys.map((key) => `${key}${params[key]}`).join('');

    // Firmar con HMAC-SHA256
    const signature = createHmac('sha256', this.flowSecretKey).update(concatenated).digest('hex');

    return signature;
  }

  /**
   * Crea una orden de pago en Flow
   */
  async createOrder(params: FlowCreateOrderParams): Promise<FlowCreateOrderResponse> {
    try {
      // Construir parámetros requeridos por Flow
      // Flow requiere montos CLP como enteros (sin decimales)
      const amount = Math.round(params.amount);

      const flowParams: Record<string, any> = {
        apiKey: this.flowApiKey,
        commerceOrder: params.commerceOrder,
        subject: params.subject,
        amount: amount,
        email: params.email,
        urlConfirmation: this.urlConfirmation,
        urlReturn: this.urlReturn,
        currency: 'CLP',
        paymentMethod: 9, // Todos los medios de pago
      };

      // Agregar datos opcionales si existen
      if (params.optionalData) {
        flowParams.optional = JSON.stringify(params.optionalData);
      }

      // Generar firma (SIN el campo 's' incluido)
      const signature = this.generateSignature(flowParams);
      flowParams.s = signature;

      this.logger.log(`🔑 Generated signature: ${signature.substring(0, 10)}...`);

      this.logger.log(
        `🔐 Creating Flow order: ${params.commerceOrder} - Amount: ${amount} CLP (rounded from ${params.amount})`,
      );

      // Construir body como x-www-form-urlencoded
      const body = new URLSearchParams();
      Object.keys(flowParams).forEach((key) => {
        body.append(key, String(flowParams[key]));
      });

      this.logger.log(`📤 Sending to Flow: ${JSON.stringify(Object.fromEntries(body))}`);

      // Enviar POST a Flow con body form-urlencoded
      const response = await firstValueFrom(
        this.httpService.post(`${this.flowApiUrl}/payment/create`, body.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          timeout: 10000,
        }),
      );

      const { url, token, flowOrder } = (response as any).data;

      // Construir URL de checkout
      const checkoutUrl = `${url}?token=${token}`;

      this.logger.log(`✅ Flow order created successfully: ${flowOrder} - Token: ${token}`);

      return {
        url,
        token,
        flowOrder: String(flowOrder),
        checkoutUrl,
      };
    } catch (error: any) {
      const errorMessage = error?.response?.data || error?.message || 'Unknown error';
      const errorStatus = error?.response?.status || 'N/A';
      this.logger.error(
        `❌ Error creating Flow order (Status ${errorStatus}): ${JSON.stringify(errorMessage)}`,
        error?.stack,
      );
      throw new Error(`Failed to create Flow payment order: ${JSON.stringify(errorMessage)}`);
    }
  }

  /**
   * Consulta el estado de una orden de pago en Flow
   */
  async getOrderStatus(token: string): Promise<FlowOrderStatus> {
    try {
      const flowParams: Record<string, any> = {
        apiKey: this.flowApiKey,
        token: token,
      };

      // Generar firma
      const signature = this.generateSignature(flowParams);
      flowParams.s = signature;

      this.logger.log(`🔍 Querying Flow order status for token: ${token}`);

      // Enviar GET a Flow
      const response = await firstValueFrom(
        this.httpService.get(`${this.flowApiUrl}/payment/getStatus`, {
          params: flowParams,
          timeout: 10000,
        }),
      );

      this.logger.log(
        `📊 Flow order status received: ${(response as any).data.flowOrder} - Status: ${(response as any).data.status}`,
      );

      return (response as any).data;
    } catch (error: any) {
      this.logger.error(
        `❌ Error getting Flow order status: ${error?.message || 'Unknown error'}`,
        error?.stack,
      );
      throw new Error(`Failed to get Flow payment status: ${error?.message || 'Unknown error'}`);
    }
  }
}
