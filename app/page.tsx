export default function Home() {
  return (
    <main className="site-shell">
      <header className="site-header">
        <div>
          <p className="eyebrow">STOWMASTER 3D</p>
          <h1>선박 컨테이너 적재 시뮬레이터</h1>
        </div>
        <p className="site-note">3D 화물 적재 · 무게중심 관리 · 안전 규칙</p>
      </header>
      <iframe
        className="game-frame"
        src="/cargo-hold.html"
        title="STOWMASTER 3D 선박 적재 게임"
      />
    </main>
  );
}
