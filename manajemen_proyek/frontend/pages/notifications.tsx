import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { Bell, Check, CheckCheck, Trash2, Clock, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useRouter } from 'next/router';

interface Notification {
  id: number;
  title: string;
  message: string;
  type: string;
  related_id?: number;
  is_read: boolean;
  created_at: string;
}

const NotificationsPage = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread' | 'read'>('all');
  const router = useRouter();

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/notifications?filter=${filter}`);
      setNotifications(response.data || []);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, [filter]);

  const markAsRead = async (id: number) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
      );
    } catch (error) {
      console.error('Failed to mark as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  const deleteNotification = async (id: number) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.is_read) {
      await markAsRead(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'approval_request' && notification.related_id) {
      router.push(`/approvals/${notification.related_id}`);
    } else if (notification.type === 'approval_approved' || notification.type === 'approval_rejected') {
      router.push('/approvals?filter=my_requests');
    } else if (notification.type === 'project_update' && notification.related_id) {
      router.push(`/projects/${notification.related_id}`);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'approval_request':
        return <AlertCircle className="text-yellow-500" size={20} />;
      case 'approval_approved':
        return <CheckCircle className="text-green-500" size={20} />;
      case 'approval_rejected':
        return <XCircle className="text-red-500" size={20} />;
      case 'project_update':
        return <Bell className="text-blue-500" size={20} />;
      default:
        return <Bell className="text-gray-500" size={20} />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return 'Baru saja';
    if (minutes < 60) return `${minutes} menit yang lalu`;
    if (hours < 24) return `${hours} jam yang lalu`;
    if (days < 7) return `${days} hari yang lalu`;
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Navbar />
        <main className="flex-1 overflow-y-auto pt-16 md:pt-20 px-4 md:px-8 pb-6">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifikasi</h1>
                <p className="text-sm text-gray-600 mt-1">
                  {unreadCount > 0 ? `${unreadCount} notifikasi belum dibaca` : 'Tidak ada notifikasi baru'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <CheckCheck size={18} />
                  <span className="hidden sm:inline">Tandai Semua Dibaca</span>
                </button>
              )}
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-2 mb-6 border-b border-gray-200">
            {(['all', 'unread', 'read'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 font-medium text-sm transition-colors border-b-2 ${
                  filter === f
                    ? 'text-primary border-primary'
                    : 'text-gray-600 border-transparent hover:text-gray-900'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'unread' ? 'Belum Dibaca' : 'Sudah Dibaca'}
              </button>
            ))}
          </div>

          {/* Notifications List */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-300 mb-4" />
              <p className="text-gray-500">Tidak ada notifikasi</p>
            </div>
          ) : (
            <div className="space-y-2">
              {notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`bg-white rounded-lg border transition-all hover:shadow-md ${
                    notification.is_read ? 'border-gray-200' : 'border-blue-200 bg-blue-50'
                  }`}
                >
                  <div className="p-4 flex items-start gap-4">
                    {/* Icon */}
                    <div className="flex-shrink-0 mt-1">{getNotificationIcon(notification.type)}</div>

                    {/* Content */}
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <h3
                        className={`text-sm font-semibold mb-1 ${
                          notification.is_read ? 'text-gray-900' : 'text-gray-900'
                        }`}
                      >
                        {notification.title}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">{notification.message}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock size={14} />
                        <span>{formatDate(notification.created_at)}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {!notification.is_read && (
                        <button
                          onClick={() => markAsRead(notification.id)}
                          className="p-2 text-gray-400 hover:text-primary hover:bg-blue-50 rounded-lg transition-colors"
                          title="Tandai dibaca"
                        >
                          <Check size={18} />
                        </button>
                      )}
                      <button
                        onClick={() => deleteNotification(notification.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Hapus"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default NotificationsPage;

