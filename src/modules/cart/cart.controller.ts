import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CartService } from './cart.service';
import { CurrentUser } from '../../shared/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../shared/guards/jwt-auth.guard';

@ApiTags('cart')
@Controller('cart')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartController {
  constructor(private cartService: CartService) {}

  @Get()
  @ApiOperation({ summary: 'Get current cart' })
  async getCart(@CurrentUser() user: any) {
    return this.cartService.getCart(user.id);
  }

  @Post('add')
  @ApiOperation({ summary: 'Add item to cart' })
  async addItem(@CurrentUser() user: any, @Body() body: { productId: number; quantity?: number; veterinaryId?: number }) {
    return this.cartService.addItem(user.id, body);
  }

  @Put(':lineId')
  @ApiOperation({ summary: 'Update cart line quantity' })
  async updateLine(@Param('lineId') lineId: string, @Body() body: { quantity: number }) {
    return this.cartService.updateLine(parseInt(lineId), body);
  }

  @Delete(':lineId')
  @ApiOperation({ summary: 'Remove cart line' })
  async removeLine(@Param('lineId') lineId: string) {
    return this.cartService.removeLine(parseInt(lineId));
  }

  @Post('checkout')
  @ApiOperation({ summary: 'Checkout cart' })
  async checkout(@CurrentUser() user: any) {
    return this.cartService.checkout(user.id);
  }
}
