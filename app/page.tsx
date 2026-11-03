import Link from "next/link";
import BookingForm from "@/components/site/BookingForm";
import NextSlots from "@/components/site/NextSlots";
import { CLINIC, SERVICES } from "@/lib/clinic";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Dentist",
  name: CLINIC.name,
  description: "Family dental clinic offering checkups, root canal treatment, braces, whitening and implants.",
  telephone: CLINIC.phoneTel,
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  address: {
    "@type": "PostalAddress",
    streetAddress: CLINIC.streetAddress,
    addressLocality: CLINIC.city,
    addressRegion: CLINIC.region,
    postalCode: CLINIC.postalCode,
    addressCountry: "IN",
  },
  openingHoursSpecification: [
    {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
      opens: "10:00",
      closes: "18:00",
    },
  ],
  medicalSpecialty: "Dentistry",
};

function Logo() {
  return (
    <svg width="34" height="34" viewBox="0 0 34 34" role="img" aria-label={`${CLINIC.name} tooth logo`}>
      <rect width="34" height="34" rx="9" fill="var(--brand)" />
      <path
        d="M11 9c2-1.2 4-.4 6 .2 2-.6 4-1.4 6-.2 2.2 1.3 1.8 5-.1 8-.7 1.2-1 3.5-1.6 5.6-.4 1.4-1.6 1.4-2 0-.4-1.4-.5-3-1.4-3-.9 0-1 1.6-1.4 3-.4 1.4-1.6 1.4-2 0-.6-2.1-.9-4.4-1.6-5.6-1.9-3-2.3-6.7-.1-8z"
        fill="var(--brand-ink)"
      />
    </svg>
  );
}

export default function Home() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <header className="wrap">
        <nav className="crumbs" aria-label="Breadcrumb">
          <ol>
            <li>Home</li>
            <li>Dental clinic in {CLINIC.city}</li>
          </ol>
        </nav>
        <div className="site-nav">
          <Link className="logo" href="/">
            <Logo />
            {CLINIC.name}
          </Link>
          <nav aria-label="Site sections">
            <a className="link" href="#services">Services</a>
            <a className="link" href="#doctor">Doctor</a>
            <a className="link" href="#reviews">Reviews</a>
            <a className="link" href="#visit">Visit us</a>
            <a className="link" href="#privacy">Privacy</a>
            <a className="btn accent sm" href="#booking">Book now</a>
          </nav>
        </div>
      </header>

      <main>
        <section className="wrap hero" aria-labelledby="h1">
          <div>
            <h1 id="h1">Gentle dental care for the whole family</h1>
            <p className="lead">
              {CLINIC.name} in Saheed Nagar, {CLINIC.city}. Same week appointments, clear prices before treatment, and a
              doctor who explains each step.
            </p>
            <div className="cta">
              <a className="btn accent" href="#booking">Book an appointment</a>
              <a className="btn" href={`https://wa.me/${CLINIC.whatsapp}`} target="_blank" rel="noopener noreferrer">
                Chat on WhatsApp
              </a>
            </div>
            <div className="trust">
              <div><b>12 yrs</b>of practice</div>
              <div><b>4.9</b>from 600+ patients</div>
              <div><b>Mon to Sat</b>10 AM to 6 PM</div>
            </div>
          </div>
          <NextSlots />
        </section>

        <section className="sec" id="services">
          <div className="wrap">
            <h2>Treatments and prices</h2>
            <p className="sub">Starting prices in rupees. The doctor confirms the exact cost after examination.</p>
            <div className="grid3">
              {SERVICES.map((s) => (
                <article className="card" key={s.id}>
                  <h3>{s.name}</h3>
                  <p>{s.desc}</p>
                  <div className="price">From &#8377;{s.price.toLocaleString("en-IN")}</div>
                </article>
              ))}
            </div>
          </div>
        </section>

        <section className="sec" id="doctor">
          <div className="wrap">
            <h2>Meet the doctor</h2>
            <div className="doc">
              <div className="portrait" role="img" aria-label={`Portrait placeholder for ${CLINIC.doctor}`}>RM</div>
              <div>
                <h3>{CLINIC.doctor}, {CLINIC.doctorTitle}</h3>
                <p className="muted" style={{ marginTop: 8, maxWidth: "60ch" }}>
                  {CLINIC.doctor} has treated families in {CLINIC.city} for 12 years and specialises in painless root canal
                  treatment. Every plan starts with a short conversation about what you want from your smile.
                </p>
                <ul>
                  <li>Single sitting root canal where the tooth allows it</li>
                  <li>Digital X-ray in the clinic, results shown on screen</li>
                  <li>Child friendly, with a calm waiting area</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="reviews">
          <div className="wrap">
            <h2>What patients say</h2>
            <div className="grid3">
              <figure className="card quote"><p>&quot;I was scared of root canals. It took one visit and I felt almost nothing.&quot;</p><cite>Sample review, Priya D.</cite></figure>
              <figure className="card quote"><p>&quot;Booking online was quick and the clinic started right on time.&quot;</p><cite>Sample review, Amit N.</cite></figure>
              <figure className="card quote"><p>&quot;My daughter&apos;s braces were explained clearly, with the full cost upfront.&quot;</p><cite>Sample review, Lipsa M.</cite></figure>
            </div>
          </div>
        </section>

        <section className="sec" id="booking">
          <div className="wrap">
            <h2>Book your appointment</h2>
            <p className="sub">Choose a date, pick a free time, and the clinic sees it at once.</p>
            <div className="book">
              <BookingForm />
              <div className="panel" id="visit">
                <h3>Visit us</h3>
                <p className="muted" style={{ marginTop: 8 }}>{CLINIC.addressLine}</p>
                <p style={{ marginTop: 8 }}>
                  <b>Phone:</b> <a href={`tel:${CLINIC.phoneTel}`}>{CLINIC.phoneDisplay}</a>
                </p>
                <table className="hours" aria-label="Clinic hours">
                  <tbody>
                    <tr><td>Monday to Saturday</td><td>10:00 AM to 6:00 PM</td></tr>
                    <tr><td>Lunch break</td><td>1:30 PM to 2:30 PM</td></tr>
                    <tr><td>Sunday</td><td>Closed</td></tr>
                  </tbody>
                </table>
                <p className="muted" style={{ marginTop: 14, fontSize: ".9rem" }}>
                  Emergency tooth pain? Call us and we will fit you in the same day where possible.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="sec" id="privacy" aria-labelledby="privacy-title">
          <div className="wrap">
            <h2 id="privacy-title">Your privacy matters</h2>
            <div className="privacy card">
              <p>
                When you book, we collect your name, mobile number, chosen treatment, date and time so the clinic
                can confirm and manage your appointment.
              </p>
              <p>
                We use this information only for appointment care and clinic operations. We do not display patient
                details publicly or sell them to advertisers.
              </p>
              <p className="muted">
                Please do not include sensitive medical details in the booking form. Call the clinic if you need to
                discuss your health history. Ask the clinic team how to access or correct your information.
              </p>
              <p className="privacy-note">
                This notice is general information, not legal advice. The clinic should review it with qualified
                legal counsel before going live.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="site wrap">
        <p>&copy; {new Date().getFullYear()} {CLINIC.name}, {CLINIC.city} · <a href="#privacy">Privacy notice</a></p>
      </footer>
    </>
  );
}
