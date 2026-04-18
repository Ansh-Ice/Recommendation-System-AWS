function AboutPage() {
  return (
    <section className="page">
      <div className="content-panel content-panel--narrow">
        <div className="section-heading">
          <h1>About This Project</h1>
          <p>
            This frontend is built for a movie recommendation system backed by a Flask API on
            AWS. The current version focuses on a simple search-to-results flow and leaves
            room to add authentication, user profiles, and favorites later.
          </p>
        </div>

        <div className="about-copy">
          <p>
            The app uses reusable React components, React Router for page navigation, and a
            dedicated service layer for backend communication. That structure keeps the code
            readable today and easier to extend as the system grows.
          </p>
        </div>
      </div>
    </section>
  );
}

export default AboutPage;
