import { Pipe, PipeTransform, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Pipe({ name: 'orderStatus', standalone: true, pure: false })
export class OrderStatusPipe implements PipeTransform {
  private readonly translate = inject(TranslateService);

  transform(status: string | null | undefined): string {
    if (status == null || status === '') return '';
    const key = 'order.statusValues.' + status;
    const translated = this.translate.instant(key);
    return translated === key ? status : translated;
  }
}
