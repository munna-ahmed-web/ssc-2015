"use client";

export default function StatsSection() {
  const stats = [
    { value: "2015", label: "Founded" },
    { value: "100+", label: "Active Members" },
    { value: "Weekly", label: "Contribution Cycle" },
    { value: "100%", label: "Transparent" },
  ];

  return (
    <section className="bg-muted/30 border-y border-border py-16">
      <div className="mx-auto max-w-7xl px-6">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-3xl font-bold font-heading text-foreground">
                {stat.value}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
