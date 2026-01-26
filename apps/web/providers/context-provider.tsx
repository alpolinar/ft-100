"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { client, getQueryClient, TRPCProvider } from "../lib/trpc";

export function ContextProvider({
    children,
}: Readonly<{ children?: React.ReactNode }>) {
    const queryClient = getQueryClient();

    return (
        <TRPCProvider trpcClient={client} queryClient={queryClient}>
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        </TRPCProvider>
    );
}
