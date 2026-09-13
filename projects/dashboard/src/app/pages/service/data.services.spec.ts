import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { ProductService } from './product.service';
import { CustomerService } from './customer.service';
import { CountryService } from './country.service';
import { PhotoService } from './photo.service';
import { NodeService } from './node.service';
import { IconService } from './icon.service';

describe('Demo Data Services', () => {
    let httpTestingController: HttpTestingController;

    beforeEach(() => {
        TestBed.configureTestingModule({
            providers: [provideHttpClient(), provideHttpClientTesting(), ProductService, CustomerService, CountryService, PhotoService, NodeService, IconService]
        });
        httpTestingController = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpTestingController.verify();
    });

    it('ProductService should return products data and generated properties', async () => {
        const service = TestBed.inject(ProductService);
        expect(service).toBeTruthy();
        const data = service.getProductsData();
        expect(data.length).toBeGreaterThan(0);
        expect(service.generateId().length).toBe(5);
        expect(typeof service.generateName()).toBe('string');
        expect(typeof service.generatePrice()).toBe('number');
        expect(typeof service.generateQuantity()).toBe('number');
        expect(typeof service.generateStatus()).toBe('string');
        expect(typeof service.generateRating()).toBe('number');

        expect((await service.getProductsMini()).length).toBeGreaterThan(0);
        expect((await service.getProductsSmall()).length).toBeGreaterThan(0);
        expect((await service.getProducts()).length).toBeGreaterThan(0);
        expect((await service.getProductsWithOrdersSmall()).length).toBeGreaterThan(0);
        expect(service.getProductsWithOrdersData().length).toBeGreaterThan(0);
        expect(service.generatePrduct()).toBeTruthy();
    });

    it('CustomerService should return customer data', async () => {
        const service = TestBed.inject(CustomerService);
        expect(service).toBeTruthy();
        const data = service.getData();
        expect(data.length).toBeGreaterThan(0);

        expect((await service.getCustomersSmall()).length).toBeGreaterThan(0);
        expect((await service.getCustomersMedium()).length).toBeGreaterThan(0);
        expect((await service.getCustomersLarge()).length).toBeGreaterThan(0);
        expect((await service.getCustomersXLarge()).length).toBeGreaterThan(0);
    });

    it('CountryService should return countries data', async () => {
        const service = TestBed.inject(CountryService);
        expect(service).toBeTruthy();
        const countries = await service.getCountries();
        expect(countries.length).toBeGreaterThan(0);
    });

    it('PhotoService should return photos data', async () => {
        const service = TestBed.inject(PhotoService);
        expect(service).toBeTruthy();
        const images = await service.getImages();
        expect(images.length).toBeGreaterThan(0);
    });

    it('NodeService should return tree nodes data', async () => {
        const service = TestBed.inject(NodeService);
        expect(service).toBeTruthy();
        expect((await service.getFiles()).length).toBeGreaterThan(0);
        expect((await service.getTreeNodes()).length).toBeGreaterThan(0);
        expect((await service.getLazyFiles()).length).toBeGreaterThan(0);
        expect((await service.getFilesystem()).length).toBeGreaterThan(0);
        expect((await service.getTreeTableNodes()).length).toBeGreaterThan(0);
        expect((await service.getLargeTreeNodes()).length).toBeGreaterThan(0);
    });

    it('IconService should fetch icons from assets', () => {
        const service = TestBed.inject(IconService);
        expect(service).toBeTruthy();

        service.getIcons().subscribe((icons) => {
            expect(icons).toEqual(['pi-check', 'pi-times']);
        });

        const req = httpTestingController.expectOne('assets/demo/data/icons.json');
        expect(req.request.method).toBe('GET');
        req.flush({ icons: ['pi-check', 'pi-times'] });
    });
});
