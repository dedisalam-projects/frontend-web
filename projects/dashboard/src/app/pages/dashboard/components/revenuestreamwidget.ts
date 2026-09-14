import { afterNextRender, Component, effect, inject, PLATFORM_ID, signal } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { ChartModule } from 'primeng/chart';
import { LayoutService } from 'shared-ui';

@Component({
    standalone: true,
    selector: 'app-revenue-stream-widget',
    imports: [ChartModule],
    template: `<div class="card mb-8!" style="min-height: 480px;">
        <div class="font-semibold text-xl mb-4">Revenue Stream</div>
        @if (chartData()) {
            <p-chart type="bar" [data]="chartData()" [options]="chartOptions()" class="h-100" />
        } @else {
            <div class="h-100 flex items-center justify-center" aria-hidden="true">
                <i class="pi pi-spin pi-spinner text-2xl text-muted-color"></i>
            </div>
        }
    </div>`
})
export class RevenueStreamWidget {
    layoutService = inject(LayoutService);
    platformId = inject(PLATFORM_ID);

    chartData = signal<any>(null);

    chartOptions = signal<any>(null);

    constructor() {
        afterNextRender(() => {
            setTimeout(() => {
                this.initChart();
            }, 150);
        });

        effect(() => {
            this.layoutService.layoutConfig().darkTheme;
            setTimeout(() => {
                this.initChart();
            }, 150);
        });
    }

    initChart() {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        const documentStyle = getComputedStyle(document.documentElement);
        const textColor = documentStyle.getPropertyValue('--text-color');
        const borderColor = documentStyle.getPropertyValue('--surface-border');
        const textMutedColor = documentStyle.getPropertyValue('--text-color-secondary');

        this.chartData.set({
            labels: ['Q1', 'Q2', 'Q3', 'Q4'],
            datasets: [
                {
                    type: 'bar',
                    label: 'Subscriptions',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-400'),
                    data: [4000, 10000, 15000, 4000],
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Advertising',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-300'),
                    data: [2100, 8400, 2400, 7500],
                    barThickness: 32
                },
                {
                    type: 'bar',
                    label: 'Affiliate',
                    backgroundColor: documentStyle.getPropertyValue('--p-primary-200'),
                    data: [4100, 5200, 3400, 7400],
                    borderRadius: {
                        topLeft: 8,
                        topRight: 8,
                        bottomLeft: 0,
                        bottomRight: 0
                    },
                    borderSkipped: false,
                    barThickness: 32
                }
            ]
        });

        this.chartOptions.set({
            maintainAspectRatio: false,
            aspectRatio: 0.8,
            plugins: {
                legend: {
                    labels: {
                        color: textColor
                    }
                }
            },
            scales: {
                x: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: 'transparent',
                        borderColor: 'transparent'
                    }
                },
                y: {
                    stacked: true,
                    ticks: {
                        color: textMutedColor
                    },
                    grid: {
                        color: borderColor,
                        borderColor: 'transparent',
                        drawTicks: false
                    }
                }
            }
        });
    }
}
