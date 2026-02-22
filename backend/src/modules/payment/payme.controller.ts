import { Controller, Post, Body, Headers, HttpCode, HttpStatus, UnauthorizedException } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { PaymeService } from './payme.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Payme')
@Controller('api/payment/payme')
export class PaymeController {
  private readonly merchantKey: string;

  constructor(
    private readonly paymeService: PaymeService,
    private readonly config: ConfigService,
  ) {
    this.merchantKey = this.config.get<string>('PAYME_MERCHANT_KEY', '');
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Payme JSON-RPC endpoint' })
  async handleRpc(
    @Body() body: any,
    @Headers('authorization') authHeader: string,
  ) {
    // Basic auth check
    if (!this.verifyAuth(authHeader)) {
      return {
        jsonrpc: '2.0',
        id: body.id,
        error: { code: -32504, message: 'Unauthorized' },
      };
    }

    const { method, params, id } = body;

    try {
      let result: any;

      switch (method) {
        case 'CheckPerformTransaction':
          result = await this.paymeService.checkPerformTransaction(params);
          break;
        case 'CreateTransaction':
          result = await this.paymeService.createTransaction(params);
          break;
        case 'PerformTransaction':
          result = await this.paymeService.performTransaction(params);
          break;
        case 'CancelTransaction':
          result = await this.paymeService.cancelTransaction(params);
          break;
        case 'CheckTransaction':
          result = await this.paymeService.checkTransaction(params);
          break;
        default:
          return {
            jsonrpc: '2.0',
            id,
            error: { code: -32601, message: 'Method not found' },
          };
      }

      return { jsonrpc: '2.0', id, result };
    } catch (err: any) {
      return {
        jsonrpc: '2.0',
        id,
        error: err.rpcError || { code: -32400, message: err.message },
      };
    }
  }

  private verifyAuth(authHeader: string): boolean {
    if (!authHeader?.startsWith('Basic ')) return false;
    const decoded = Buffer.from(authHeader.slice(6), 'base64').toString();
    const [, key] = decoded.split(':');
    return key === this.merchantKey;
  }
}
