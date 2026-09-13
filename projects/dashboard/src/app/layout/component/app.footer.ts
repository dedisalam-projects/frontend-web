import { Component } from '@angular/core';

@Component({
    standalone: true,
    selector: 'app-footer',
    template: `<div class="layout-footer">
        SAKAI by
        <a href="https://primeng.org" target="_blank" rel="noopener noreferrer" class="text-primary-700 dark:text-primary-400 font-bold hover:underline">PrimeNG</a>
    </div>`
})
export class AppFooter {}
