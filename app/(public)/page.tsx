import Link from "next/link";
import { SiteHeader } from "@/components/marketing/site-header";
import { SiteFooter } from "@/components/marketing/site-footer";
import { LinkButton } from "@/components/ui/button";
import { StatusBadge } from "@/components/ui/badge";

const FEATURES = [
  {
    title: "Vehicle-aware routing",
    description: "Routes are calculated using truck dimensions, axle count, trailers and weight — not a generic car route.",
  },
  {
    title: "Clearance checking",
    description: "Compare vehicle height against known bridge and tunnel clearance data along the route corridor.",
  },
  {
    title: "Fleet profiles",
    description: "Save trucks and trailer combinations once, then reuse them across every route you plan.",
  },
  {
    title: "Route warnings",
    description: "See known conflicts — height, weight, width, curfews, closures — before the wheels start moving.",
  },
  {
    title: "Australian focus",
    description: "Built around Australian heavy-vehicle operations across every state and territory.",
  },
  {
    title: "Clear route status",
    description: "Every route is labelled Checked, Warning, Restricted or Unknown — never assumed safe.",
  },
];

export default function LandingPage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="border-b border-[var(--color-border)] bg-white">
          <div className="mx-auto max-w-6xl px-4 py-20 md:px-6 md:py-28">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold text-[var(--color-primary)]">
                Heavy vehicle route planning · Australia
              </p>
              <h1 className="mt-4 text-4xl font-semibold tracking-tight text-[var(--color-foreground)] md:text-5xl">
                Heavy vehicle routing that starts with the vehicle.
              </h1>
              <p className="mt-5 text-lg text-[var(--color-foreground-muted)] max-w-2xl">
                Enter truck dimensions, calculate routes, and check known restrictions before the
                wheels start moving.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <LinkButton href="/register" size="lg">Start planning</LinkButton>
                <LinkButton href="#product" size="lg" variant="secondary">See how it works</LinkButton>
              </div>
            </div>
          </div>
        </section>

        <section id="product" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="grid gap-8 lg:grid-cols-2 lg:items-center">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Route Planner</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                Plan against the vehicle you&apos;re actually driving
              </h2>
              <p className="mt-3 text-[var(--color-foreground-muted)]">
                Select a saved truck, enter an origin and destination, and Montague requests a
                trucking-aware route while checking it against stored clearance, weight, and access
                restriction data along the corridor.
              </p>
            </div>
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface-muted)] p-5">
              <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
                <p className="text-xs font-medium text-[var(--color-foreground-muted)]">Selected vehicle</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-foreground)]">Kenworth T610 · Semi Trailer</p>
                <div className="mt-3 grid grid-cols-4 gap-2 text-center">
                  {[["4.30 m", "H"], ["2.50 m", "W"], ["19.0 m", "L"], ["42.5 t", ""]].map(([v, l]) => (
                    <div key={v} className="rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] py-2">
                      <p className="text-sm font-semibold text-[var(--color-foreground)]">{v}</p>
                      <p className="text-[10px] text-[var(--color-foreground-muted)]">{l}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-4 flex items-center justify-between rounded-[var(--radius-sm)] bg-[var(--color-surface-muted)] px-3 py-2">
                  <span className="text-sm text-[var(--color-foreground)]">Melbourne → Sydney</span>
                  <StatusBadge status="warning" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-[var(--color-border)] bg-[var(--color-surface-muted)]">
          <div className="mx-auto max-w-6xl px-4 py-16 md:px-6">
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map((feature) => (
                <div key={feature.title} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
                  <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{feature.title}</h3>
                  <p className="mt-2 text-sm text-[var(--color-foreground-muted)]">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="safety" className="mx-auto max-w-6xl px-4 py-16 md:px-6">
          <div className="grid gap-10 lg:grid-cols-2">
            <div>
              <p className="text-sm font-semibold text-[var(--color-primary)]">Data & safety</p>
              <h2 className="mt-2 text-2xl font-semibold text-[var(--color-foreground)]">
                Route information, not a guarantee
              </h2>
              <p className="mt-3 text-[var(--color-foreground-muted)]">
                Montague combines a configured trucking-aware routing provider with a database of
                known heavy-vehicle restrictions and clearances. Restriction records are labelled
                with their verification status and source, so it&apos;s always clear what has been
                checked and what hasn&apos;t.
              </p>
              <p className="mt-3 text-[var(--color-foreground-muted)]">
                We never describe a route as guaranteed safe or definitely legal. Drivers and
                operators remain responsible for complying with road signage, permits, and applicable
                transport authority requirements.
              </p>
            </div>
            <div id="fleet" className="space-y-3">
              {[
                ["clear", "Route checked against available data. No known conflicts found."],
                ["warning", "Route requires attention. Review flagged issues before departure."],
                ["restricted", "Known restriction conflicts with this vehicle configuration."],
                ["unknown", "Insufficient data for part of this route. Additional verification may be required."],
              ].map(([status, copy]) => (
                <div key={status} className="flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-4">
                  <StatusBadge status={status} />
                  <p className="text-sm text-[var(--color-foreground-muted)]">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t border-[var(--color-border)] bg-[var(--color-nav)]">
          <div className="mx-auto max-w-6xl px-4 py-16 text-center md:px-6">
            <h2 className="text-2xl font-semibold text-white md:text-3xl">
              Put your fleet on a better route.
            </h2>
            <p className="mt-3 text-[var(--color-nav-muted)]">
              Create a Montague account and add your first truck in minutes.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <LinkButton href="/register" size="lg">Start planning</LinkButton>
              <Link
                href="/login"
                className="inline-flex h-12 items-center justify-center rounded-[var(--radius-md)] px-6 text-base font-medium text-white/90 hover:text-white"
              >
                Login
              </Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}
