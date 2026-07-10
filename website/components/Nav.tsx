import { GitHubIcon, LogoMark } from './icons';

export default function Nav() {
  return (
    <nav aria-label="主導覽">
      <div className="in">
        <a className="logo" href="#top">
          <span className="m">
            <LogoMark />
          </span>
          palserver GUI
        </a>
        <div className="links">
          <a href="#features">功能</a>
          <a href="#how">如何運作</a>
          <a href="#start">開始使用</a>
          <a href="#team">團隊</a>
        </div>
        <div className="sp" />
        <a className="btn btn-g btn-sm" href="https://github.com/io-software-ai/palserver-gui">
          <GitHubIcon />
          GitHub
        </a>
        <a className="btn btn-p btn-sm" href="https://github.com/io-software-ai/palserver-gui/releases">
          下載
        </a>
      </div>
    </nav>
  );
}
