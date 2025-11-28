"use client";

export default function Home() {
    const testRequest = async () => {
        const result = await fetch("http://localhost:3001");
        if (!result.ok) {
            throw new Error("Request Failed");
        }

        const data = await result.json();
        console.log("data", data);
    };
    return (
        <button
            type="button"
            onClick={() => {
                testRequest();
            }}
        >
            send request
        </button>
    );
}
