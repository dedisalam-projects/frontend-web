import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';

export interface User {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
    isActive?: boolean;
}

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private apiUrl = 'http://localhost:3000/api/v1/users';

    constructor(private http: HttpClient) {}

    getUsers(): Promise<User[]> {
        const token = typeof localStorage !== 'undefined' ? localStorage.getItem('accessToken') : null;
        if (!token) {
            return Promise.resolve([]);
        }

        let headers = new HttpHeaders();
        headers = headers.set('Authorization', `Bearer ${token}`);
        
        return firstValueFrom(this.http.get<any>(this.apiUrl, { headers }))
            .then(res => {
                if (Array.isArray(res)) return res as User[];
                if (res && Array.isArray(res.data)) return res.data as User[];
                return [] as User[];
            })
            .catch(error => {
                console.error('Error fetching users:', error);
                throw error;
            });
    }
}
