import {Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from "../../environments/environment";

@Injectable({
    providedIn: 'root'
})
export class AuthService {

    private loginUrl = environment.backendUrl;

    private storedRoles = localStorage.getItem('userRole');
    roles = signal<string[]>(this.loadRoles());

    constructor(private http: HttpClient) {}

    private loadRoles(): string[] {
        const stored = localStorage.getItem('userRole');
        if (!stored) return [];

        try {
            const parsed = JSON.parse(stored);
            if (Array.isArray(parsed)) {
                return parsed.map(r => r.toUpperCase());
            }
        } catch {
            // Not JSON → treat as plain string
        }

        // Handle comma-separated or single value
        return stored.split(',').map(r => r.trim().toUpperCase()).filter(Boolean);
    }

    setRoles(newRoles: string[]) {
        this.roles.set(newRoles.map(r => r.toUpperCase()));
        localStorage.setItem('roles', JSON.stringify(newRoles));
    }

    hasRole(role: string): boolean {
        return this.roles().includes(role.toUpperCase());
    }

    checkRoleExpression(expression: string): boolean {
        const tokens = expression.trim().split(/\s+/);

        let result = this.hasRole(tokens[0]); // First role
        let i = 1;

        while (i < tokens.length) {
            const operator = tokens[i++];
            const nextRole = tokens[i++];
            const hasNext = this.hasRole(nextRole);

            if (operator === '&&') {
                result = result && hasNext;
            } else if (operator === '||') {
                result = result || hasNext;
            }
        }

        return result;
    }

    login(credentials: { password: any; rememberMe: any; username: any }): Observable<any> {
        return this.http.post<any>(this.loginUrl + '/api/v1/login', credentials, { withCredentials: true });
    }
    logout(): Observable<any> {
        console.log('Logged out');
        console.log(this.loginUrl + '/api/v1/logout');
        return this.http.get<any>(this.loginUrl + '/api/v1/logout', { withCredentials: true });
    }
    hc(): Observable<any> {
        return this.http.get<any>(this.loginUrl + '/api/v1/hc',{ withCredentials: true });
    }
    hcWithout(): Observable<any> {
        return this.http.get<any>(this.loginUrl + '/api/v1/hc');
    }
    status(): Observable<any> {
        return this.http.get<any>(this.loginUrl + '/api/v1/status');
    }
    hcAdmin(): Observable<any> {
        return this.http.get<any>(this.loginUrl + '/api/v1/hc/admin',{ withCredentials: true });
    }
    hcTeamManager(): Observable<any> {
        return this.http.get<any>(this.loginUrl + '/api/v1/hc/tm',{ withCredentials: true });
    }
    changePassword(passwordData: { password: string; passwordRepeat: string }): Observable<any> {
        return this.http.post<any>(this.loginUrl + '/api/v1/change-password', passwordData, { withCredentials: true });
    }


}
