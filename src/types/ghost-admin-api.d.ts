declare module '@tryghost/admin-api' {
  export interface GhostAdminAPIOptions {
    url: string;
    key: string;
    version: string;
  }

  export interface Post {
    id: string;
    title?: string;
    updated_at?: string;
    lexical?: string;
    mobiledoc?: string;
  }

  export default class GhostAdminAPI implements AdminAPI {
    constructor(options: GhostAdminAPIOptions);
    posts: Resource<any>;
  }
}