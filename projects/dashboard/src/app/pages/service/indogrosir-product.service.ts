import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface PricingTier {
    unit: string;
    minQty: number;
    fraction: number;
    price: number;
    label: string;
}

export interface ProductSpec {
    length?: number;
    width?: number;
    height?: number;
    grossWeight?: number;
    bpom?: string;
}

export interface Branch {
    _id?: string;
    code: string;
    name: string;
    city?: string;
    address?: string;
    phone?: string;
    latitude?: string;
    longitude?: string;
    imageUrl?: string;
    isActive?: boolean;
    rawMetadata?: any;
}

export interface Category {
    _id?: string;
    code: string;
    name: string;
    level?: string;
    divisionCode?: string;
    departmentCode?: string;
    categoryCode?: string;
    url?: string;
    isActive?: boolean;
}

export interface Brand {
    _id?: string;
    code: string;
    name: string;
    isActive?: boolean;
}

export interface IndogrosirProduct {
    _id?: string;
    plu: string;
    name: string;
    brand?: string;
    brandId?: Brand | string;
    category?: string;
    categoryId?: Category | string;
    description?: string;
    imageUrl?: string;
    unit?: string;
    price: number;
    promoPrice?: number;
    lowestPrice?: number;
    pricingTiers?: PricingTier[];
    branchCode?: string;
    branchId?: Branch | string;
    isAvailable?: boolean;
    stock?: number;
    spec?: ProductSpec;
    source?: string;
    lastSyncedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export interface BranchIslandSummary {
    island: string;
    count: number;
    branches: {
        code: string;
        name: string;
        city: string;
        address?: string;
        phone?: string;
    }[];
}

export interface CategoryDivisionSummary {
    code: string;
    name: string;
    divisionCode: string;
    departmentCount: number;
    categoryCount: number;
}

export interface IndogrosirRecap {
    branches: {
        total: number;
        active: number;
        byIsland: BranchIslandSummary[];
        items: Branch[];
    };
    categories: {
        total: number;
        levels: {
            division: number;
            department: number;
            category: number;
            total: number;
        };
        divisions: CategoryDivisionSummary[];
        items: Category[];
    };
    brands: {
        total: number;
        active: number;
        items: Brand[];
    };
    products: {
        total: number;
        available: number;
        outOfStock: number;
        totalInventoryValue: number;
        averagePrice: number;
        lastSyncedAt: string | null;
        items: IndogrosirProduct[];
    };
}

export interface ProductStats {
    totalProducts: number;
    availableProducts: number;
    outOfStockProducts: number;
    totalCategories: number;
    categories: string[];
    totalInventoryValue: number;
    lastSyncTime: string | null;
}

export interface ApiResponse<T> {
    success: boolean;
    data?: T;
    message?: string;
    meta?: {
        timestamp?: string;
    };
}

export interface PaginatedProducts {
    items: IndogrosirProduct[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class IndogrosirProductService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/products`;

    getProducts(options: {
        page?: number;
        limit?: number;
        search?: string;
        category?: string;
        isAvailable?: boolean;
        sortBy?: string;
        sortOrder?: 'asc' | 'desc';
    } = {}): Observable<ApiResponse<PaginatedProducts>> {
        let params = new HttpParams();
        if (options.page) params = params.set('page', options.page.toString());
        if (options.limit) params = params.set('limit', options.limit.toString());
        if (options.search) params = params.set('search', options.search);
        if (options.category) params = params.set('category', options.category);
        if (options.isAvailable !== undefined) params = params.set('isAvailable', options.isAvailable.toString());
        if (options.sortBy) params = params.set('sortBy', options.sortBy);
        if (options.sortOrder) params = params.set('sortOrder', options.sortOrder);

        return this.http.get<ApiResponse<PaginatedProducts>>(this.apiUrl, { params, withCredentials: true });
    }

    getStats(): Observable<ApiResponse<ProductStats>> {
        return this.http.get<ApiResponse<ProductStats>>(`${this.apiUrl}/stats`, { withCredentials: true });
    }

    getProduct(idOrPlu: string): Observable<ApiResponse<IndogrosirProduct>> {
        return this.http.get<ApiResponse<IndogrosirProduct>>(`${this.apiUrl}/${idOrPlu}`, { withCredentials: true });
    }

    createProduct(product: Partial<IndogrosirProduct>): Observable<ApiResponse<IndogrosirProduct>> {
        return this.http.post<ApiResponse<IndogrosirProduct>>(this.apiUrl, product, { withCredentials: true });
    }

    updateProduct(idOrPlu: string, product: Partial<IndogrosirProduct>): Observable<ApiResponse<IndogrosirProduct>> {
        return this.http.put<ApiResponse<IndogrosirProduct>>(`${this.apiUrl}/${idOrPlu}`, product, { withCredentials: true });
    }

    deleteProduct(idOrPlu: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${this.apiUrl}/${idOrPlu}`, { withCredentials: true });
    }

    syncCatalog(options: { branchCode?: string; limit?: number; forceRefresh?: boolean } = {}): Observable<ApiResponse<any>> {
        return this.http.post<ApiResponse<any>>(`${this.apiUrl}/sync`, options, { withCredentials: true });
    }

    // Branches
    getBranches(): Observable<ApiResponse<Branch[]>> {
        return this.http.get<ApiResponse<Branch[]>>(`${environment.apiUrl}/branches`, { withCredentials: true });
    }
    getBranch(idOrCode: string): Observable<ApiResponse<Branch & { products?: IndogrosirProduct[] }>> {
        return this.http.get<ApiResponse<Branch & { products?: IndogrosirProduct[] }>>(`${environment.apiUrl}/branches/${idOrCode}`, { withCredentials: true });
    }
    createBranch(branch: Partial<Branch>): Observable<ApiResponse<Branch>> {
        return this.http.post<ApiResponse<Branch>>(`${environment.apiUrl}/branches`, branch, { withCredentials: true });
    }
    updateBranch(id: string, branch: Partial<Branch>): Observable<ApiResponse<Branch>> {
        return this.http.put<ApiResponse<Branch>>(`${environment.apiUrl}/branches/${id}`, branch, { withCredentials: true });
    }
    deleteBranch(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/branches/${id}`, { withCredentials: true });
    }

    // Categories
    getCategoriesList(): Observable<ApiResponse<Category[]>> {
        return this.http.get<ApiResponse<Category[]>>(`${environment.apiUrl}/categories`, { withCredentials: true });
    }
    createCategory(category: Partial<Category>): Observable<ApiResponse<Category>> {
        return this.http.post<ApiResponse<Category>>(`${environment.apiUrl}/categories`, category, { withCredentials: true });
    }
    updateCategory(id: string, category: Partial<Category>): Observable<ApiResponse<Category>> {
        return this.http.put<ApiResponse<Category>>(`${environment.apiUrl}/categories/${id}`, category, { withCredentials: true });
    }
    deleteCategory(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/categories/${id}`, { withCredentials: true });
    }

    // Brands
    getBrandsList(): Observable<ApiResponse<Brand[]>> {
        return this.http.get<ApiResponse<Brand[]>>(`${environment.apiUrl}/brands`, { withCredentials: true });
    }
    createBrand(brand: Partial<Brand>): Observable<ApiResponse<Brand>> {
        return this.http.post<ApiResponse<Brand>>(`${environment.apiUrl}/brands`, brand, { withCredentials: true });
    }
    updateBrand(id: string, brand: Partial<Brand>): Observable<ApiResponse<Brand>> {
        return this.http.put<ApiResponse<Brand>>(`${environment.apiUrl}/brands/${id}`, brand, { withCredentials: true });
    }
    deleteBrand(id: string): Observable<ApiResponse<any>> {
        return this.http.delete<ApiResponse<any>>(`${environment.apiUrl}/brands/${id}`, { withCredentials: true });
    }

    // Recapitulasi Full Dashboard
    getRecap(): Observable<ApiResponse<IndogrosirRecap>> {
        return this.http.get<ApiResponse<IndogrosirRecap>>(`${environment.apiUrl}/products/recap`, { withCredentials: true });
    }
}
