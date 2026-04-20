import { motion } from "framer-motion";
import { Film, Code, Server, Sparkles } from "lucide-react";

function AboutPage() {
  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflow: 'hidden', paddingTop: '120px', paddingBottom: '6rem' }}>
      <div className="bg-blob bg-blob--1" style={{ top: '10%', left: '20%' }} />
      <div className="bg-blob bg-blob--2" style={{ bottom: '20%', right: '20%' }} />
      <div className="bg-blob bg-blob--3" style={{ top: '50%', left: '50%', transform: 'translate(-50%, -50%)', opacity: 0.3 }} />

      <div className="container" style={{ position: 'relative', zIndex: 10, maxWidth: '800px' }}>
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center"
        >
          <h1 style={{ fontSize: 'clamp(3rem, 6vw, 4rem)', marginBottom: '1rem' }}>
            The Architecture of <br />
            <span className="text-gradient">Awe.</span>
          </h1>
          <p style={{ fontSize: '1.25rem', color: 'var(--color-text-secondary)', marginBottom: '4rem', lineHeight: '1.8' }}>
            Cinemagic Pro is not just a recommendation system. It's an exploration of human emotion, mapped through data to find stories that resonate with your soul.
          </p>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-panel"
          style={{ padding: '3rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}
        >
          {[
            {
              icon: <Film size={32} className="text-gradient-warm" />,
              title: "Cinematic Experience",
              text: "Every pixel is crafted to evoke the feeling of a dimly lit movie theater before the curtains rise. It's cozy, safe, and exhilarating."
            },
            {
              icon: <Server size={32} className="text-gradient" />,
              title: "Intelligence & Backend",
              text: "Powered by a robust Flask API on AWS, this platform parses thousands of data points to find exact matches for your cinematic curiosity."
            },
            {
              icon: <Code size={32} style={{ color: "var(--color-primary)" }} />,
              title: "Modern Engineering",
              text: "Built on React, Vite, and Framer Motion, ensuring every transition is 60fps smooth, every interaction feels alive, and the architecture scales natively."
            }
          ].map((item, index) => (
            <motion.div 
              key={item.title}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.2 + 0.4 }}
              style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start' }}
            >
              <div style={{ padding: '1rem', background: 'rgba(255,255,255,0.05)', borderRadius: 'var(--border-radius-md)' }}>
                {item.icon}
              </div>
              <div>
                <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.title}</h3>
                <p style={{ color: 'var(--color-text-secondary)', lineHeight: '1.6' }}>{item.text}</p>
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
           initial={{ opacity: 0 }}
           whileInView={{ opacity: 1 }}
           viewport={{ once: true }}
           transition={{ delay: 1 }}
           className="text-center"
           style={{ marginTop: '4rem' }}
        >
          <Sparkles size={48} className="text-gradient-warm mx-auto" style={{ marginBottom: '1rem', opacity: 0.5 }} />
          <p style={{ fontFamily: 'var(--font-display)', fontWeight: 700, letterSpacing: '2px', color: 'var(--color-text-muted)' }}>
            BUILT FOR THE DREAMERS
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default AboutPage;
