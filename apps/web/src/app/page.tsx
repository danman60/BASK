import { PRODUCT_NAME, SPINE_VERSION } from '@bask/core';

export default function Home() {
  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-3 p-10">
      <h1 className="text-3xl font-semibold tracking-tight">{PRODUCT_NAME}</h1>
      <p className="text-sm opacity-70">
        M0 spine — scaffold online. Dev harness pages land in later M0 steps.
      </p>
      <p className="font-mono text-xs opacity-50">spine {SPINE_VERSION}</p>
    </main>
  );
}
