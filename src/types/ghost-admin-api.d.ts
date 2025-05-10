declare module '@tryghost/admin-api' {
  export interface GhostAdminAPIOptions {
    url: string;
    key: string;
    version: string;
    ghostPath?: string;
  }

  export interface PaginationOptions {
    page?: number;
    limit?: number | string;
    order?: string;
  }

  export interface BrowseOptions extends PaginationOptions {
    include?: string;
    fields?: string;
    filter?: string;
    formats?: string;
  }

  export interface GhostError extends Error {
    errorType?: string;
    statusCode?: number;
    errors?: Array<{
      message: string;
      errorType: string;
    }>;
  }

  export interface Post {
    id: string;
    uuid?: string;
    title?: string;
    status?: 'draft' | 'published' | 'scheduled' | 'sent';
    created_at?: string;
    updated_at?: string;
    published_at?: string;
    lexical?: string;
    meta?: {
      pagination?: {
        total?: number;
      };
    };
  }

  export interface Resource<T> {
    browse(options?: BrowseOptions): Promise<T[]>;
    edit(data: Partial<T> & { id: string }): Promise<T>;
  }

  export interface AdminAPI {
    posts: Resource<Post>;
    settings: {
      browse(): Promise<Setting[]>;
      edit(data: { key: string; value: any }[]): Promise<Setting[]>;
    };
  }

  export default class GhostAdminAPI implements AdminAPI {
    constructor(options: GhostAdminAPIOptions);
    posts: Resource<Post>;
    settings: {
      browse(): Promise<Setting[]>;
      edit(data: { key: string; value: any }[]): Promise<Setting[]>;
    };
  }
}