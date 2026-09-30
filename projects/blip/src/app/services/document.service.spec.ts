import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { DocumentService } from './document.service';
import { environment } from '../../environments/environment';

describe('DocumentService', () => {
  let service: DocumentService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        DocumentService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(DocumentService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should fetch documents with pagination and query', () => {
    const mockResponse = {
      success: true,
      data: {
        items: [{ _id: '1', receiptNo: 'TRV123' }],
        total: 1,
        page: 1,
        limit: 10,
        totalPages: 1,
      },
    };

    service.getDocuments('traveloka', { page: 1, limit: 10, search: 'TRV' }).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.items).toHaveLength(1);
      expect(res.data.items[0].receiptNo).toBe('TRV123');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka?page=1&limit=10&search=TRV`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should create document via POST', () => {
    const newDoc = { receiptNo: 'TRV999', totalAmount: 100000 };
    const mockResponse = {
      success: true,
      data: { _id: '99', ...newDoc },
    };

    service.createDocument('traveloka', newDoc).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data._id).toBe('99');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(newDoc);
    req.flush(mockResponse);
  });

  it('should delete document via DELETE', () => {
    const mockResponse = { success: true, data: { id: '99' } };

    service.deleteDocument('traveloka', '99').subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka/99`);
    expect(req.request.method).toBe('DELETE');
    req.flush(mockResponse);
  });

  it('should fetch documents with default params', () => {
    service.getDocuments('traveloka').subscribe((res) => {
      expect(res.success).toBe(true);
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { items: [], total: 0, page: 1, limit: 10, totalPages: 0 } });
  });

  it('should get single document via GET', () => {
    service.getDocument('traveloka', '123').subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data._id).toBe('123');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka/123`);
    expect(req.request.method).toBe('GET');
    req.flush({ success: true, data: { _id: '123' } });
  });

  it('should update document via PUT', () => {
    const updateData = { notes: 'Updated' };
    service.updateDocument('traveloka', '123', updateData).subscribe((res) => {
      expect(res.success).toBe(true);
      expect(res.data.notes).toBe('Updated');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka/123`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(updateData);
    req.flush({ success: true, data: { _id: '123', ...updateData } });
  });

  it('should request PDF blob via POST /generate', () => {
    const mockBlob = new Blob(['%PDF-1.4'], { type: 'application/pdf' });

    service.generatePdfBlob('traveloka', '123').subscribe((blob) => {
      expect(blob).toBeTruthy();
      expect(blob.type).toBe('application/pdf');
    });

    const req = httpMock.expectOne(`${environment.apiUrl}/documents/traveloka/123/generate`);
    expect(req.request.method).toBe('POST');
    expect(req.request.responseType).toBe('blob');
    req.flush(mockBlob);
  });
});
