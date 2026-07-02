import { Controller, Post, Headers, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiHeader, ApiBody } from '@nestjs/swagger';
import { SyncService } from './sync.service';
import { Public } from '../../shared/decorators/public.decorator';

@ApiTags('sync')
@Controller('sync')
export class SyncController {
  constructor(private syncService: SyncService) {}

  @Public()
  @Post('webhook')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Webhook para recibir cambios desde Odoo' })
  @ApiHeader({ name: 'x-sync-source', required: true, description: 'Debe ser "odoo"' })
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        entity: { type: 'string', example: 'veterinary' },
        action: { type: 'string', example: 'create' },
        data: { type: 'object' },
      },
    },
  })
  async webhook(
    @Headers('x-sync-source') syncSource: string,
    @Body() body: { entity: string; action: string; data: any },
  ) {
    if (syncSource !== 'odoo') {
      return { success: false, message: 'Invalid sync source' };
    }
    await this.syncService.handleWebhook(body.entity, body.action, body.data);
    return { success: true };
  }
}
