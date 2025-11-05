import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import Sidebar from '@/components/Sidebar';
import { purchaseRequestAPI } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ShoppingCart, ArrowLeft, CheckCircle, XCircle, MessageSquare,
  Clock, AlertCircle, Send
} from 'lucide-react';
import { formatCurrency } from '@/lib/dummyData';

export default function PurchaseRequestDetail() {
  const router = useRouter();
  const { id } = router.query;
  const { isAuthenticated, loading: authLoading, user } = useAuth();
  const [pr, setPR] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [comment, setComment] = useState('');

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
      return;
    }

    if (isAuthenticated && id) {
      fetchPR();
    }
  }, [isAuthenticated, authLoading, id, router]);

  const fetchPR = async () => {
    try {
      setLoading(true);
      const response = await purchaseRequestAPI.getById(id as string);
      setPR(response.data);
    } catch (err) {
      console.error('Error fetching PR:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!confirm('Approve purchase request ini?')) return;
    
    setActionLoading(true);
    try {
      await purchaseRequestAPI.approve(id as string, pr.current_stage, comment);
      setComment('');
      fetchPR();
    } catch (err) {
      alert('Gagal approve');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    const reason = prompt('Alasan penolakan:');
    if (!reason) return;

    setActionLoading(true);
    try {
      await purchaseRequestAPI.reject(id as string, pr.current_stage, reason);
      fetchPR();
    } catch (err) {
      alert('Gagal reject');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!comment.trim()) return;

    try {
      await purchaseRequestAPI.addComment(id as string, comment);
      setComment('');
      fetchPR();
    } catch (err) {
      alert('Gagal menambah komentar');
    }
  };

  const getStageStatus = (stage: string) => {
    if (!pr || !pr.approval_history) return 'pending';
    
    const history = pr.approval_history.find((h: any) => h.stage === stage);
    return history?.status || 'pending';
  };

  const stages = ['Purchasing', 'Cost Control', 'GM'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <p className="text-gray-600 mt-4">Memuat PR...</p>
        </div>
      </div>
    );
  }

  if (!pr) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <ShoppingCart className="mx-auto text-gray-400" size={64} />
          <p className="text-gray-600 mt-4">PR tidak ditemukan</p>
          <Link href="/purchase-requests">
            <button className="btn-primary mt-4">Kembali</button>
          </Link>
        </div>
      </div>
    );
  }

  const canApprove = pr.status === 'pending' && pr.current_stage === user?.role?.name;

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar />
      <Navbar />

      <main className="md:ml-64 pt-16 md:pt-20 p-3 sm:p-4 md:p-6">
        <Link href="/purchase-requests">
          <button className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft size={20} />
            <span>Kembali</span>
          </button>
        </Link>

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShoppingCart className="text-primary" />
              Purchase Request
            </h1>
            <p className="text-gray-600 mt-1 font-mono">{pr.pr_number}</p>
          </div>
        </div>

        {/* Approval Timeline */}
        <div className="card mb-6">
          <h3 className="text-lg font-semibold mb-4">Approval Progress</h3>
          <div className="flex items-center justify-between">
            {stages.map((stage, index) => {
              const status = getStageStatus(stage);
              const isCurrent = pr.current_stage === stage;
              
              return (
                <div key={stage} className="flex-1 relative">
                  <div className="flex flex-col items-center">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      status === 'approved' ? 'bg-green-500' :
                      status === 'rejected' ? 'bg-red-500' :
                      isCurrent ? 'bg-yellow-500' : 'bg-gray-300'
                    }`}>
                      {status === 'approved' ? <CheckCircle className="text-white" size={24} /> :
                       status === 'rejected' ? <XCircle className="text-white" size={24} /> :
                       <Clock className="text-white" size={24} />}
                    </div>
                    <p className="text-sm font-medium mt-2">{stage}</p>
                    <p className="text-xs text-gray-500">{status}</p>
                  </div>
                  {index < stages.length - 1 && (
                    <div className={`absolute top-6 left-1/2 w-full h-0.5 ${
                      status === 'approved' ? 'bg-green-500' : 'bg-gray-300'
                    }`} style={{ transform: 'translateY(-50%)' }} />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* PR Info */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 card">
            <h3 className="text-lg font-semibold mb-4">Detail PR</h3>
            
            <div className="space-y-3 mb-6">
              <div>
                <span className="text-sm text-gray-600">Proyek:</span>
                <p className="font-medium">{pr.project?.name}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Judul:</span>
                <p className="font-medium">{pr.title}</p>
              </div>
              <div>
                <span className="text-sm text-gray-600">Deskripsi:</span>
                <p className="text-gray-700">{pr.description || '-'}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-gray-600">Required Date:</span>
                  <p className="font-medium">{pr.required_date || '-'}</p>
                </div>
                <div>
                  <span className="text-sm text-gray-600">Priority:</span>
                  <p className="font-medium capitalize">{pr.priority}</p>
                </div>
              </div>
            </div>

            {/* Items */}
            <h4 className="font-semibold mb-3">Item Material</h4>
            <div className="space-y-3">
              {pr.items?.map((item: any, index: number) => (
                <div key={index} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <p className="font-medium">{item.material?.name}</p>
                      <p className="text-sm text-gray-600">{item.vendor}</p>
                    </div>
                    <p className="font-semibold">{formatCurrency(item.quantity * item.estimated_price)}</p>
                  </div>
                  <p className="text-sm text-gray-600">
                    {item.quantity} {item.unit} × {formatCurrency(item.estimated_price)}
                  </p>
                  {item.notes && <p className="text-sm text-gray-500 mt-1">{item.notes}</p>}
                </div>
              ))}
            </div>

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Total:</span>
                <span className="text-2xl font-bold text-primary">{formatCurrency(pr.total_amount)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            {/* Approval Actions */}
            {canApprove && (
              <div className="card">
                <h3 className="text-lg font-semibold mb-4">Action Required</h3>
                <div className="space-y-3">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Komentar (opsional)"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    rows={3}
                  />
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="w-full btn-primary bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle size={18} />
                    Approve
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center justify-center gap-2"
                  >
                    <XCircle size={18} />
                    Reject
                  </button>
                </div>
              </div>
            )}

            {/* Comments */}
            <div className="card">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MessageSquare size={20} />
                Comments
              </h3>
              
              <div className="space-y-3 mb-4 max-h-64 overflow-y-auto">
                {pr.comments?.map((c: any, index: number) => (
                  <div key={index} className="bg-gray-50 rounded-lg p-3">
                    <p className="font-medium text-sm">{c.user?.name}</p>
                    <p className="text-sm text-gray-700 mt-1">{c.comment}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {new Date(c.created_at).toLocaleString('id-ID')}
                    </p>
                  </div>
                ))}
                {(!pr.comments || pr.comments.length === 0) && (
                  <p className="text-sm text-gray-500 text-center py-4">Belum ada komentar</p>
                )}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Tulis komentar..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddComment()}
                />
                <button
                  onClick={handleAddComment}
                  className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                >
                  <Send size={18} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

