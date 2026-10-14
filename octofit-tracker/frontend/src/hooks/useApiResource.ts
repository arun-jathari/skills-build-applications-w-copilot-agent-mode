import { useEffect, useState } from 'react';

type JsonGetter = <T>(path: string) => Promise<T>;

export type ApiResource<T> =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'success'; data: T };

export function useApiResource<T>(path: string, getJson: JsonGetter): ApiResource<T> {
  const [resource, setResource] = useState<ApiResource<T>>({ status: 'loading' });

  useEffect(() => {
    let current = true;
    setResource({ status: 'loading' });
    getJson<T>(path)
      .then((data) => {
        if (current) setResource({ status: 'success', data });
      })
      .catch((error: unknown) => {
        if (current) {
          setResource({
            status: 'error',
            error: error instanceof Error ? error : new Error('Request failed'),
          });
        }
      });
    return () => {
      current = false;
    };
  }, [path, getJson]);

  return resource;
}