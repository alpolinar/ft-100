"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "../utils/trpc";

export default function Home() {
    const trpc = useTRPC();

    const { data, isLoading } = useQuery(trpc.user.queryOptions({ id: 2 }));

    return <div>{isLoading ? "fetching..." : data?.message}</div>;
}
