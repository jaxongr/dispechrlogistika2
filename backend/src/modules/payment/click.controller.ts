import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ClickService } from './click.service.js';
import { Public } from '../../common/decorators/public.decorator.js';

@ApiTags('Click.uz')
@Controller('api/payment/click')
export class ClickController {
  constructor(private readonly clickService: ClickService) {}

  @Post('prepare')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click prepare webhook' })
  async prepare(@Body() body: any) {
    return this.clickService.prepare(body);
  }

  @Post('complete')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Click complete webhook' })
  async complete(@Body() body: any) {
    return this.clickService.complete(body);
  }
}
