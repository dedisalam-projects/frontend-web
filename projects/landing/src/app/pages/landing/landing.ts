import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { TopbarWidget } from './components/topbarwidget.component';
import { HeroWidget } from './components/herowidget';
import { FeaturesWidget } from './components/featureswidget';
import { HighlightsWidget } from './components/highlightswidget';
import { PricingWidget } from './components/pricingwidget';
import { FooterWidget } from './components/footerwidget';

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [RouterModule, TopbarWidget, HeroWidget, FeaturesWidget, HighlightsWidget, PricingWidget, FooterWidget],
    template: `
        <div class="bg-surface-0 dark:bg-surface-900">
            <div id="home" class="landing-wrapper overflow-hidden">
                <topbar-widget class="py-6 px-6 mx-0 md:mx-12 lg:mx-20 lg:px-20 flex items-center justify-between relative lg:static" />
                <hero-widget />
                
                @defer (on viewport) {
                    <features-widget />
                } @placeholder {
                    <div style="min-height: 400px;"></div>
                }

                @defer (on viewport) {
                    <highlights-widget />
                } @placeholder {
                    <div style="min-height: 400px;"></div>
                }

                @defer (on viewport) {
                    <pricing-widget />
                } @placeholder {
                    <div style="min-height: 400px;"></div>
                }

                @defer (on viewport) {
                    <footer-widget />
                } @placeholder {
                    <div style="min-height: 200px;"></div>
                }
            </div>
        </div>
    `
})
export class Landing {}
