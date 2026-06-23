import { useParams, Navigate } from 'react-router-dom';
import { ADMIN_TAB_COMPONENTS, isAdminTab } from '@/admin/AdminPanel';

export default function AdminTabPage() {
  const { tab } = useParams<{ tab: string }>();

  if (!tab || !isAdminTab(tab)) {
    return <Navigate to="/" replace />;
  }

  const AdminComponent = ADMIN_TAB_COMPONENTS[tab];
  return <AdminComponent />;
}
