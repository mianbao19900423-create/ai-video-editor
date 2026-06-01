interface D1Database {
  prepare: (query: string) => D1PreparedStatement;
  batch: (statements: D1PreparedStatement[]) => Promise<D1Result<any>[]>;
  dump: () => Promise<Uint8Array>;
}

interface D1PreparedStatement {
  bind: (...params: any[]) => D1PreparedStatement;
  all: () => Promise<D1Result<any>>;
  run: () => Promise<D1Result<any>>;
  first: () => Promise<any>;
}

interface D1Result<T> {
  results: T[];
  error: Error | null;
  meta: {
    duration: number;
    changes: number;
  };
}
