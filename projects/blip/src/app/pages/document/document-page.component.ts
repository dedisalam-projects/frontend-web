import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { DocumentTableComponent } from './document-table.component';

@Component({
  selector: 'app-document-page',
  standalone: true,
  imports: [CommonModule, DocumentTableComponent],
  template: `
    <app-document-table [provider]="provider"></app-document-table>
  `,
})
export class DocumentPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  provider = 'gojek';

  ngOnInit() {
    this.route.data.subscribe((data) => {
      if (data['provider']) {
        this.provider = data['provider'];
      }
    });

    this.route.params.subscribe((params) => {
      if (params['provider']) {
        this.provider = params['provider'];
      }
    });
  }
}
