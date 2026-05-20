import { useContext } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

function RequireAuth({ children, roles }) {
  const { currentUser, hasRole, loading } = useContext(AuthContext);
  const location = useLocation();

  // 如果还在加载中，等待加载完成，不要立即跳转
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <div>加载中...</div>
      </div>
    );
  }

  // 加载完成后，如果没有用户，才跳转到登录页
  if (!currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (roles && !hasRole(roles)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default RequireAuth;


