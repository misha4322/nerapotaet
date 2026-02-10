import { getServerSession } from "next-auth";
import { authOptions } from "../api/auth/[...nextauth]/route";
import { redirect } from "next/navigation";
import Link from "next/link";
import "./ProfilePage.css";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  const user = session.user;

  return (
    <div className="profile-container">
      <div className="profile-background">
        <div className="profile-pattern"></div>
      </div>

      <div className="profile-wrapper">
        <div className="profile-card">
          <div className="profile-header">
            <div className="avatar">
              {user?.name?.[0]?.toUpperCase() ?? "G"}
            </div>
            
            <div className="profile-info">
              <h1 className="profile-name">
                {user?.name ?? "Геймер"}
              </h1>
              <p className="profile-email">{user?.email}</p>
              <div className="profile-badge">Участник GameHub</div>
            </div>
          </div>

          <div className="profile-stats">
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Игр в библиотеке</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Достижений</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Друзей</div>
            </div>
            
            <div className="stat-card">
              <div className="stat-value">0</div>
              <div className="stat-label">Часов в играх</div>
            </div>
          </div>

          <div className="profile-actions">
            <Link href="/games" className="action-btn action-primary">
              🎮 Перейти к играм
            </Link>
            
            <Link href="/community" className="action-btn action-secondary">
              👥 Сообщество
            </Link>
            
            <Link href="/settings" className="action-btn action-tertiary">
              ⚙️ Настройки
            </Link>
            
            <Link
              href="/api/auth/signout"
              className="logout-btn"
            >
              🚪 Выйти из аккаунта
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}