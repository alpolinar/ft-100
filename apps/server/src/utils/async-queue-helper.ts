type Resolver<T> = (value: T) => void;

export function createAsyncQueue<T>() {
  const queue: T[] = [];
  let resolve: Resolver<T> | null = null;

  return {
    push(value: T) {
      if (resolve) {
        resolve(value);
        resolve = null;
      } else {
        queue.push(value);
      }
    },

    async next(): Promise<T> {
      const item = queue.shift();

      if (item) {
        return item;
      }

      return new Promise<T>((res) => {
        resolve = res;
      });
    },
  };
}
