import Image from 'next/image';

export default function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="gov-footer" role="contentinfo">
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Image src="/prism-logo-icon.png" alt="" width={28} height={28}
          style={{ borderRadius: '50%', opacity: 0.8 }} />
        <div>
          <div style={{ fontWeight: 700, color: 'white', fontSize: '0.78rem' }}>PUDUCHERRY POLICE</div>
          <div style={{ fontSize: '0.68rem' }}>Government of Puducherry</div>
        </div>
      </div>

      <div className="gov-footer-links" style={{ fontSize: '0.72rem' }}>
        <a href="#">Website Policies</a>
        <a href="#">Privacy Policy</a>
        <a href="#">Terms of Use</a>
        <a href="#">Accessibility Statement</a>
        <a href="#">Help</a>
      </div>

      <div style={{ textAlign: 'right', fontSize: '0.68rem' }}>
        <div>Content owned and maintained by Puducherry Police Department</div>
        <div style={{ marginTop: 2, color: '#fcd34d', fontWeight: 600 }}>
          SYNTHETIC DEMO — Not an Official Government System
        </div>
        <div style={{ marginTop: 1, color: 'rgba(255,255,255,0.5)' }}>
          Last Updated: {new Date().toLocaleDateString('en-IN')}
        </div>
      </div>
    </footer>
  );
}
