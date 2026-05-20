import Link from "next/link";

type LegalSection = {
  body: string;
  title: string;
};

type LegalPageProps = {
  description: string;
  sections: LegalSection[];
  title: string;
};

export default function LegalPage({
  description,
  sections,
  title,
}: LegalPageProps) {
  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <section className="rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(18,18,19,0.96)_0%,rgba(9,9,10,0.99)_100%)] p-6 shadow-[0_28px_80px_rgba(0,0,0,0.34)] sm:p-8">
        <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-orange-300/70">
          Burger
        </p>
        <h1 className="mt-4 text-4xl font-black tracking-[-0.04em] text-white sm:text-5xl">
          {title}
        </h1>
        <p className="mt-4 max-w-3xl text-sm leading-7 text-white/62">
          {description}
        </p>
        <div className="mt-6 flex flex-wrap gap-3 text-sm text-white/54">
          <Link className="text-orange-300 hover:text-white" href="/">
            Home
          </Link>
          <Link className="text-orange-300 hover:text-white" href="/public/explore">
            Menu
          </Link>
          <Link className="text-orange-300 hover:text-white" href="/contact">
            Contact
          </Link>
        </div>
      </section>

      <section className="space-y-4">
        {sections.map((section) => (
          <article
            className="rounded-[1.6rem] border border-white/8 bg-white/[0.03] p-5 sm:p-6"
            key={section.title}
          >
            <h2 className="text-xl font-semibold text-white">{section.title}</h2>
            <p className="mt-3 text-sm leading-7 text-white/66">{section.body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
