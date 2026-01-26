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
      if (queue.length > 0) {
        return queue.shift()!;
      }

      return new Promise<T>((res) => {
        resolve = res;
      });
    },
  };
}
