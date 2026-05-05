export function Hero({ settings }) {
  return (
    <section className="hero">
      <div className="hero-content">
        <p className="hero-kicker">{settings.store_name}</p>
        <h1 className="hero-title">{settings.hero_title}</h1>
        <p className="hero-subtitle">{settings.hero_subtitle}</p>
        <a href="#store-catalog" className="hero-cta">
          Shop now
        </a>
      </div>
    </section>
  );
}
