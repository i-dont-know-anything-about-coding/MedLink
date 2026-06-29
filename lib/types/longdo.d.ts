/**
 * Type declarations แบบ minimal สำหรับ Longdo Map JavaScript API
 * (ไม่มี @types/longdo-map บน npm — ประกาศเองเท่าที่โปรเจกต์นี้ใช้จริง)
 * อ้างอิงจาก https://api.longdo.com/map/doc/ref.php
 */

declare global {
  interface LongdoLocation {
    lon: number;
    lat: number;
  }

  interface LongdoMarkerOptions {
    title?: string;
    detail?: string;
  }

  interface LongdoRoute {
    placeholder(element: HTMLElement): LongdoRoute;
    add(markerOrLocation: LongdoLocation | LongdoMarkerInstance): LongdoRoute;
    mode(value: number): LongdoRoute;
    label(value: number): LongdoRoute;
    search(): LongdoRoute;
    clear(): LongdoRoute;
    /** ระยะทางรวมของเส้นทาง แบบมีหน่วยพร้อม format string เช่น "12.4 km" */
    distance(): string;
    /** เวลาที่ใช้เดินทางรวม แบบมีหน่วยพร้อม format string เช่น "18 min" */
    interval(): string;
  }

  interface LongdoEventBinder {
    bind(eventName: string, handler: (data?: unknown) => void): LongdoEventBinder;
    unbind(eventName: string, handler: (data?: unknown) => void): LongdoEventBinder;
  }

  interface LongdoMarkerInstance {
    readonly __longdoMarker: true;
  }

  interface LongdoMapInstance {
    Route: LongdoRoute;
    Event: LongdoEventBinder;
  }

  interface LongdoMapOptions {
    placeholder: HTMLElement;
    zoom?: number;
    location?: LongdoLocation;
    language?: string;
  }

  interface LongdoNamespace {
    Map: new (options: LongdoMapOptions) => LongdoMapInstance;
    Marker: new (location: LongdoLocation, options?: LongdoMarkerOptions) => LongdoMarkerInstance;
    RouteMode: {
      Traffic: number;
      Cost: number;
      Distance: number;
      Walk: number;
      Both: number;
      Fly: number;
    };
    RouteLabel: {
      Distance: number;
      Time: number;
      Hide: number;
    };
  }

  interface Window {
    longdo?: LongdoNamespace;
  }
}

export {};
