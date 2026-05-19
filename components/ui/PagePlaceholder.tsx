type PagePlaceholderProps = {
  title: string;
  description: string;
};

export default function PagePlaceholder({
  title,
  description,
}: PagePlaceholderProps) {
  return (
    <main className="mx-auto flex min-h-[calc(100vh-80px)] w-full max-w-3xl items-center justify-center px-6 py-24">
      <section className="w-full rounded-3xl border border-white/10 bg-black px-8 py-10 text-white shadow-2xl shadow-black/20">
        <p className="text-sm uppercase tracking-[0.3em] text-orange-400">
          Coming soon
        </p>
        <h1 className="mt-4 text-3xl font-semibold">{title}</h1>
        <p className="mt-3 text-base leading-7 text-white/70">{description}</p>
      </section>
    </main>
  );
}
