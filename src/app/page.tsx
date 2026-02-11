import Link from "next/link";
import { headers } from "next/headers";
import Image from "next/image"; // ✅ Импортируем Image
import "./Home.css";

type PostCard = {
  id: string;
  slug: string;
  title: string;
  content: string;
  createdAt: string;
  author: { username: string; avatarUrl: string | null };
  category: { title: string } | null;
  tags: { id: string; name: string }[];
};

async function getBaseUrl() {
  const h = await headers();
  const host = h.get("host") ?? "localhost:3000";
  const proto =
    h.get("x-forwarded-proto") ??
    (process.env.NODE_ENV === "development" ? "http" : "https");
  return `${proto}://${host}`;
}

async function getPosts(): Promise<PostCard[]> {
  const base = await getBaseUrl();
  const res = await fetch(`${base}/api/posts`, { cache: "no-store" });
  if (!res.ok) return [];
  const data = await res.json();
  return (data.posts ?? []) as PostCard[];
}

export default async function Home() {
  const posts = await getPosts();
  const latest = posts.slice(0, 6);

  return (
    <div className="main-container">
      <div className="main-background">
        <div className="glow-effect glow-1"></div>
        <div className="glow-effect glow-2"></div>
        <div className="glow-effect glow-3"></div>
      </div>

      <div className="nav-container">
        <div className="nav-content">
          <div className="logo-wrapper">
            <div className="logo-icon">
              <Image
                src="/fox.png" // ✅ Добавляем картинку
                alt="GameHub Logo"
                width={32}
                height={32}
                className="logo-image"
                priority // ✅ Приоритетная загрузка для логотипа
              />
            </div>
            <div className="logo-text">GameHub</div>
          </div>
          <div className="nav-links">
            <Link href="/auth/login" className="nav-btn nav-login">
              Войти
            </Link>
            <Link href="/auth/register" className="nav-btn nav-register">
              Регистрация
            </Link>
          </div>
        </div>
      </div>

      <div className="main-content">
        <div className="hero-section">
          <div className="hero-text">
            <h1 className="hero-title">
              <span className="title-main">Сообщество</span>
              <span className="title-gradient">истинных геймеров</span>
            </h1>
            <p className="hero-description">
              Присоединяйся к крупнейшему игровому сообществу! Общайся, делитесь опытом,
              находи новых друзей и будь в курсе всех игровых новинок.
            </p>
            <div className="stats-container">
              <div className="stat-card">
                <div className="stat-icon">🎮</div>
                <div className="stat-content">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Игроков онлайн</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">💬</div>
                <div className="stat-content">
                  <div className="stat-number">50K+</div>
                  <div className="stat-label">Обсуждений</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="hero-panel">
            <div className="panel-container">
              <div className="panel-badge">
                <Image
                  src="/fox.png" // ✅ Добавляем иконку
                  alt="GameHub"
                  width={48}
                  height={48}
                  className="panel-badge-image"
                />
              </div>
              <div className="panel-header">
                <h2 className="panel-title">Присоединяйся к нам</h2>
                <p className="panel-subtitle">Стань частью сообщества</p>
              </div>
              
              <div className="auth-options">
                <Link href="/auth/login" className="auth-option auth-login">
                  <div className="option-title">Войти</div>
                  <div className="option-subtitle">В существующий аккаунт</div>
                </Link>
                <Link href="/auth/register" className="auth-option auth-register">
                  <div className="option-title">Регистрация</div>
                  <div className="option-subtitle">Создать новый аккаунт</div>
                </Link>
              </div>
              
              <div className="social-divider">Или через социальные сети</div>
              
              <div className="social-buttons">
                <button className="social-btn social-google">
                  <div className="social-icon-wrapper">
                    <Image
                      src="/google.png" // ✅ Добавляем Google иконку
                      alt="Google"
                      width={20}
                      height={20}
                      className="social-icon"
                    />
                  </div>
                  <span>Google</span>
                </button>
                
                <button className="social-btn social-yandex">
                  <div className="social-icon-wrapper">
                    <Image
                      src="/yandex.png" // ✅ Добавляем Яндекс иконку
                      alt="Yandex"
                      width={20}
                      height={20}
                      className="social-icon"
                    />
                  </div>
                  <span>Яндекс</span>
                </button>
                
                <button className="social-btn social-steam">
                  <div className="social-icon-wrapper">
                    <Image
                      src="/steam.png" // ✅ Добавляем Steam иконку
                      alt="Steam"
                      width={20}
                      height={20}
                      className="social-icon"
                    />
                  </div>
                  <span>Steam</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="features-section">
          <h2 className="features-title">Что вас ждет</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-category">Общение</div>
              <h3 className="feature-name">Игровые форумы</h3>
              <p className="feature-desc">
                Общайтесь с другими игроками, делитесь впечатлениями и находите
                единомышленников по любимым играм.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-category">Сообщество</div>
              <h3 className="feature-name">Группы и кланы</h3>
              <p className="feature-desc">
                Создавайте собственные группы, находите команду для совместной игры
                или станьте частью существующего сообщества.
              </p>
            </div>
            <div className="feature-card">
              <div className="feature-category">Новости</div>
              <h3 className="feature-name">Актуальные обновления</h3>
              <p className="feature-desc">
                Будьте в курсе последних игровых новостей, обновлений и событий в
                игровом мире.
              </p>
            </div>
          </div>
        </div>

        <div className="latest-posts-section">
          <div className="latest-posts-header">
            <h2 className="features-title">Последние посты</h2>
            <Link className="latest-posts-link" href="/posts">
              Все посты →
            </Link>
          </div>

          {latest.length === 0 ? (
            <div className="latest-posts-empty">
              Пока нет постов. <Link href="/posts/new">Создать первый</Link>
            </div>
          ) : (
            <div className="latest-posts-grid">
              {latest.map((p) => (
                <Link key={p.id} href={`/posts/${p.slug}`} className="post-card">
                  <div className="post-title">{p.title}</div>
                  <div className="post-meta">
                    {p.author.username}
                    {p.category ? ` • ${p.category.title}` : ""}
                  </div>
                  <div className="post-excerpt">
                    {p.content.length > 160 ? p.content.slice(0, 160) + "…" : p.content}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}