/**
 * Type definitions for @silentbot1/nat-api
 * Drop-in replacement for nat-api with updated dependencies
 */

declare module '@silentbot1/nat-api' {
  export interface MappingOptions {
    publicPort: number;
    privatePort: number;
    protocol: 'TCP' | 'UDP';
    description?: string;
    ttl?: number;
  }

  export interface UnmapOptions {
    publicPort: number;
    protocol: 'TCP' | 'UDP';
  }

  export interface PortMapping {
    public?: { port: number };
    publicPort?: number;
    private?: { port: number };
    privatePort?: number;
    protocol?: string;
    description?: string;
    ttl?: number;
  }

  export default class NatAPI {
    constructor();

    /**
     * Create a port mapping
     */
    map(options: MappingOptions, callback: (err: Error | null) => void): void;

    /**
     * Remove a port mapping
     */
    unmap(options: UnmapOptions, callback: (err: Error | null) => void): void;

    /**
     * Get all port mappings
     */
    getMappings(callback: (err: Error | null, results: PortMapping[]) => void): void;

    /**
     * Close the client (optional - may not exist on all versions)
     */
    close?(): void;
  }
}
