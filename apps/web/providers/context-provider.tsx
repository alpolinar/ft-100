"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { client, getQueryClient, TRPCProvider } from "../utils/trpc";

export function ContextProvider({
    children,
}: Readonly<React.PropsWithChildren>) {
    const queryClient = getQueryClient();

    return (
        <TRPCProvider trpcClient={client} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </TRPCProvider>
    );
}
