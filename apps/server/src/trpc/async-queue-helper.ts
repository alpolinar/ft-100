type Resolver<T> = (value: IteratorResult<T>) => void;

export function createAsyncQueue<T>() {
    const queue: T[] = [];
    let resolve: Resolver<T> | null = null;

    return {
        push(value: T) {
            if (resolve) {
                resolve({ value, done: false });
                resolve = null;
            } else {
                queue.push(value);
            }
        },

        async next(): Promise<IteratorResult<T>> {
            if (queue.length > 0) {
                return { value: queue.shift()!, done: false };
            }

            return new Promise<IteratorResult<T>>((res) => {
                resolve = res;
            });
        },
    };
}
