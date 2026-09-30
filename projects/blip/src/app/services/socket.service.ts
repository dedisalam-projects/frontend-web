import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { io, Socket } from 'socket.io-client';
import { Observable, Subject } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DocumentEventPayload {
  provider: string;
  data?: any;
  id?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SocketService {
  private platformId = inject(PLATFORM_ID);
  private socket: Socket | null = null;

  private created$ = new Subject<DocumentEventPayload>();
  private updated$ = new Subject<DocumentEventPayload>();
  private deleted$ = new Subject<DocumentEventPayload>();
  private generated$ = new Subject<DocumentEventPayload>();

  constructor() {
    if (isPlatformBrowser(this.platformId)) {
      this.initSocket();
    }
  }

  private initSocket() {
    this.socket = io(`${environment.socketUrl}/documents`, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 2000,
    });

    this.socket.on('connect', () => {
      console.log('[SocketService] Connected to /documents namespace:', this.socket?.id);
    });

    this.socket.on('document:created', (payload: DocumentEventPayload) => {
      this.created$.next(payload);
    });

    this.socket.on('document:updated', (payload: DocumentEventPayload) => {
      this.updated$.next(payload);
    });

    this.socket.on('document:deleted', (payload: DocumentEventPayload) => {
      this.deleted$.next(payload);
    });

    this.socket.on('document:generated', (payload: DocumentEventPayload) => {
      this.generated$.next(payload);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[SocketService] Disconnected:', reason);
    });
  }

  joinProvider(provider: string) {
    if (this.socket?.connected) {
      this.socket.emit('join:provider', { provider });
    } else {
      this.socket?.once('connect', () => {
        this.socket?.emit('join:provider', { provider });
      });
    }
  }

  leaveProvider(provider: string) {
    this.socket?.emit('leave:provider', { provider });
  }

  onCreated(): Observable<DocumentEventPayload> {
    return this.created$.asObservable();
  }

  onUpdated(): Observable<DocumentEventPayload> {
    return this.updated$.asObservable();
  }

  onDeleted(): Observable<DocumentEventPayload> {
    return this.deleted$.asObservable();
  }

  onGenerated(): Observable<DocumentEventPayload> {
    return this.generated$.asObservable();
  }
}
